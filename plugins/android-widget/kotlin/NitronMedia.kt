package com.nitron.widgetstudio.nitron

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Movie
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.RectF
import android.media.MediaMetadataRetriever
import org.json.JSONObject
import java.io.File

/**
 * Проигрывание GIF и видео внутри домашнего виджета.
 *
 * RemoteViews не умеет анимацию, поэтому мы декодируем кадр сами
 * (GIF — android.graphics.Movie, видео — MediaMetadataRetriever)
 * и отдаём лаунчеру готовый bitmap. Вызывается из NitronLiveService
 * ~12 раз в секунду.
 */
object NitronMedia {

    private const val VIDEO_FRAME_BUCKET_MS = 120L

    private val movies = HashMap<String, Movie?>()
    private val retrievers = HashMap<String, MediaMetadataRetriever?>()
    private val videoFrames = HashMap<String, CachedFrame>()
    private val offscreens = HashMap<String, Bitmap>()

    private class CachedFrame(val bitmap: Bitmap, val bucket: Long)

    /** Рисует медиа-слой с учётом fit / радиуса / анимации. */
    fun draw(
        canvas: Canvas,
        context: Context,
        layer: JSONObject,
        dir: File,
        scale: Float,
        nowMs: Long,
    ) {
        val relPath = layer.optString("file", "")
        if (relPath.isEmpty()) return
        val file = File(dir, relPath)
        if (!file.exists()) return

        val x = (layer.optDouble("x", 0.0) * scale).toFloat()
        val y = (layer.optDouble("y", 0.0) * scale).toFloat()
        val w = (layer.optDouble("w", 10.0) * scale).toFloat()
        val h = (layer.optDouble("h", 10.0) * scale).toFloat()
        if (w <= 1f || h <= 1f) return

        val cx = x + w / 2f
        val cy = y + h / 2f
        val rect = RectF(x, y, x + w, y + h)

        canvas.save()

        // --- FX-анимация слоя
        var alphaMul = 1f
        when (layer.optString("anim", "none")) {
            "pulse" -> {
                val speed = layer.optDouble("animSpeed", 1.0).toFloat().coerceIn(0.25f, 3f)
                val k = 1f + 0.06f * kotlin.math.sin((nowMs / 620.0 * speed)).toFloat()
                canvas.scale(k, k, cx, cy)
            }
            "float" -> {
                val speed = layer.optDouble("animSpeed", 1.0).toFloat().coerceIn(0.25f, 3f)
                canvas.translate(0f, (kotlin.math.sin(nowMs / 700.0 * speed) * 7.0 * scale).toFloat())
            }
            "slide" -> {
                val speed = layer.optDouble("animSpeed", 1.0).toFloat().coerceIn(0.25f, 3f)
                canvas.translate((kotlin.math.sin(nowMs / 620.0 * speed) * 12.0 * scale).toFloat(), 0f)
            }
            "spin" -> {
                val speed = layer.optDouble("animSpeed", 1.0).toFloat().coerceIn(0.25f, 3f)
                canvas.rotate(((nowMs / 18.0 * speed) % 360.0).toFloat(), cx, cy)
            }
            "blink" -> {
                val speed = layer.optDouble("animSpeed", 1.0).toFloat().coerceIn(0.25f, 3f)
                alphaMul = (0.45f + 0.55f * (0.5 + 0.5 * kotlin.math.sin(nowMs / 340.0 * speed))).toFloat()
            }
        }

        val rotation = layer.optDouble("rot", 0.0).toFloat()
        if (rotation != 0f) canvas.rotate(rotation, cx, cy)

        // --- скругление
        val radius = (layer.optDouble("radius", 0.0) * scale).toFloat()
        if (radius > 0f) {
            val path = Path()
            path.addRoundRect(rect, radius, radius, Path.Direction.CW)
            canvas.clipPath(path)
        }

        val paint = Paint(Paint.FILTER_BITMAP_FLAG).apply {
            this.alpha = (255f * layer.optDouble("opacity", 1.0).toFloat() * alphaMul)
                .toInt().coerceIn(0, 255)
        }

        val bitmap = frameBitmap(context, file, layer, w.toInt().coerceAtLeast(1), h.toInt().coerceAtLeast(1), nowMs)
        if (bitmap != null) {
            drawFit(canvas, bitmap, rect, layer.optString("fit", "cover"), paint)
        }

        canvas.restore()
    }

    // ------------------------------------------------------------------ GIS/видео

    private fun frameBitmap(
        context: Context,
        file: File,
        layer: JSONObject,
        targetW: Int,
        targetH: Int,
        nowMs: Long,
    ): Bitmap? {
        return if (layer.optString("kind", "gif") == "video") {
            videoFrame(file, nowMs)
        } else {
            gifFrame(file, targetW, targetH, nowMs)
        }
    }

    private fun gifFrame(file: File, targetW: Int, targetH: Int, nowMs: Long): Bitmap? {
        val key = file.absolutePath
        val movie = movies.getOrPut(key) {
            try {
                Movie.decodeFile(key)
            } catch (t: Throwable) {
                null
            }
        }

        // Movie не понимает APNG/WebP-анимацию — покажем хотя бы первый кадр.
        if (movie == null) {
            return try {
                BitmapFactory.decodeFile(key)
            } catch (t: Throwable) {
                null
            }
        }

        val duration = movie.duration().let { if (it <= 0) 1000 else it }
        movie.setTime((nowMs % duration).toInt())

        val offKey = "$key@${targetW}x$targetH"
        var off = offscreens[offKey]
        if (off == null || off.isRecycled) {
            if (offscreens.size > 6) {
                // не копим бесконечно много offscreen-битмапов
                for (b in offscreens.values) if (!b.isRecycled) b.recycle()
                offscreens.clear()
            }
            off = Bitmap.createBitmap(targetW, targetH, Bitmap.Config.ARGB_8888)
            offscreens[offKey] = off
        }

        val canvas = Canvas(off)
        canvas.drawColor(0, PorterDuff.Mode.CLEAR)

        val mw = movie.width().coerceAtLeast(1).toFloat()
        val mh = movie.height().coerceAtLeast(1).toFloat()
        val k = maxOf(targetW / mw, targetH / mh)
        canvas.save()
        canvas.scale(k, k)
        canvas.translate((targetW / k - mw) / 2f, (targetH / k - mh) / 2f)
        movie.draw(canvas, 0f, 0f)
        canvas.restore()
        return off
    }

    private fun videoFrame(file: File, nowMs: Long): Bitmap? {
        val key = file.absolutePath
        val retriever = retrievers.getOrPut(key) {
            try {
                MediaMetadataRetriever().apply { setDataSource(key) }
            } catch (t: Throwable) {
                null
            }
        } ?: return null

        val durationMs = retriever
            .extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
            ?.toLongOrNull()
            ?.coerceAtLeast(1L) ?: 1000L

        val bucket = (nowMs % durationMs) / VIDEO_FRAME_BUCKET_MS
        val cached = videoFrames[key]
        if (cached != null && cached.bucket == bucket && !cached.bitmap.isRecycled) {
            return cached.bitmap
        }

        val timeUs = bucket * VIDEO_FRAME_BUCKET_MS * 1000L
        val frame = try {
            retriever.getFrameAtTime(timeUs, MediaMetadataRetriever.OPTION_CLOSEST_SYNC)
                ?: retriever.getFrameAtTime(timeUs, MediaMetadataRetriever.OPTION_CLOSEST)
        } catch (t: Throwable) {
            null
        } ?: return cached?.bitmap

        videoFrames[key]?.bitmap?.let { if (!it.isRecycled) it.recycle() }
        videoFrames[key] = CachedFrame(frame, bucket)
        return frame
    }

    private fun drawFit(canvas: Canvas, bitmap: Bitmap, target: RectF, fit: String, paint: Paint) {
        val bw = bitmap.width.coerceAtLeast(1).toFloat()
        val bh = bitmap.height.coerceAtLeast(1).toFloat()
        val dst: RectF = when (fit) {
            "fill" -> RectF(target)
            "contain" -> {
                val k = minOf(target.width() / bw, target.height() / bh)
                val w = bw * k
                val h = bh * k
                val cx = target.centerX()
                val cy = target.centerY()
                RectF(cx - w / 2f, cy - h / 2f, cx + w / 2f, cy + h / 2f)
            }
            else -> { // cover
                val k = maxOf(target.width() / bw, target.height() / bh)
                val w = bw * k
                val h = bh * k
                val cx = target.centerX()
                val cy = target.centerY()
                RectF(cx - w / 2f, cy - h / 2f, cx + w / 2f, cy + h / 2f)
            }
        }
        canvas.drawBitmap(bitmap, null, dst, paint)
    }

    /** Освобождает тяжёлые ресурсы перед сном сервиса. */
    fun release() {
        for (r in retrievers.values) {
            try {
                r?.release()
            } catch (t: Throwable) {
            }
        }
        retrievers.clear()
        movies.clear()
        for (f in videoFrames.values) if (!f.bitmap.isRecycled) f.bitmap.recycle()
        videoFrames.clear()
        for (b in offscreens.values) if (!b.isRecycled) b.recycle()
        offscreens.clear()
    }
}
