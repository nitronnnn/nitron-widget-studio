package com.nitron.widgetstudio.nitron

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.os.BatteryManager
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Рисует домашний виджет по spec.json из filesDir/nitron_widgets/.
 *
 * base.png — статичная часть дизайна (фон, фигуры, картинки, статичный текст).
 * live[]   — «живые» слои: часы, дата, отсчёт, батарея — перерисовываются
 *            при каждом обновлении виджета (раз в минуту), поэтому время идёт.
 */
object NitronRenderer {

    private const val DIR = "nitron_widgets"
    private const val SUPERSAMPLE = 2f
    private const val DEFAULT_TEXT = "#FFFFFFFF"

    fun render(context: Context): Bitmap? {
        val dir = widgetDir(context)
        val spec = readSpec(dir) ?: return placeholder(context, "Откройте Nitron и нажмите «На экран»")

        val designW = spec.optDouble("w", 360.0).toFloat()
        val designH = spec.optDouble("h", 170.0).toFloat()
        if (designW <= 1f || designH <= 1f) return placeholder(context, "Виджет не настроен")

        val density = context.resources.displayMetrics.density.coerceIn(1f, 4f)
        val scale = density * SUPERSAMPLE
        val pxW = (designW * scale).toInt().coerceIn(64, 4096)
        val pxH = (designH * scale).toInt().coerceIn(64, 4096)

        val bitmap = Bitmap.createBitmap(pxW, pxH, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        val baseFile = File(dir, spec.optString("base", "base.png"))
        if (baseFile.exists()) {
            val image = try {
                BitmapFactory.decodeFile(baseFile.absolutePath)
            } catch (t: Throwable) {
                null
            }
            if (image != null) {
                canvas.drawBitmap(
                    image,
                    null,
                    RectF(0f, 0f, pxW.toFloat(), pxH.toFloat()),
                    Paint(Paint.FILTER_BITMAP_FLAG),
                )
            }
        }

        val live = spec.optJSONArray("live") ?: JSONArray()
        for (i in 0 until live.length()) {
            try {
                drawLive(canvas, context, live.getJSONObject(i), scale)
            } catch (t: Throwable) {
                // один битый слой не должен убивать весь виджет
            }
        }
        return bitmap
    }

    // ---------------------------------------------------------------- layers

    private fun drawLive(canvas: Canvas, context: Context, layer: JSONObject, scale: Float) {
        val x = (layer.optDouble("x", 0.0) * scale).toFloat()
        val y = (layer.optDouble("y", 0.0) * scale).toFloat()
        val w = (layer.optDouble("w", 10.0) * scale).toFloat()
        val h = (layer.optDouble("h", 10.0) * scale).toFloat()
        val rotation = layer.optDouble("rot", 0.0).toFloat()
        val alpha = (255 * layer.optDouble("alpha", 1.0)).toInt().coerceIn(0, 255)

        canvas.save()
        if (rotation != 0f) {
            canvas.rotate(rotation, x + w / 2f, y + h / 2f)
        }

        when (layer.optString("op")) {
            "countdown" -> drawCountdown(canvas, layer, x, y, w, h, scale, alpha)
            "battery" -> drawBattery(canvas, context, layer, x, y, w, h, scale, alpha)
            else -> {
                val text = when (layer.optString("op")) {
                    "clock" -> clockText(layer)
                    "date" -> dateText(layer)
                    else -> ""
                }
                if (text.isNotEmpty()) {
                    val paint = textPaint(layer, scale, alpha)
                    val baseline = y + h / 2f - (paint.descent() + paint.ascent()) / 2f
                    val tx = when (paint.textAlign) {
                        Paint.Align.LEFT -> x
                        Paint.Align.RIGHT -> x + w
                        else -> x + w / 2f
                    }
                    canvas.drawText(text, tx, baseline, paint)
                }
            }
        }
        canvas.restore()
    }

    private fun textPaint(layer: JSONObject, scale: Float, alpha: Int): Paint {
        val sizePt = layer.optDouble("size", 16.0).toFloat().coerceIn(4f, 400f)
        val color = parseColor(layer.optString("color", DEFAULT_TEXT))
        val glowColor = parseColor(layer.optString("glow", "#00000000"))
        val glowRadius = layer.optDouble("glowR", 0.0).toFloat() * scale

        return Paint(Paint.ANTI_ALIAS_FLAG).apply {
            this.color = color
            this.alpha = alpha
            textSize = sizePt * scale
            typeface = typefaceFor(layer.optString("font", "system"), layer.optBoolean("bold", false))
            textAlign = when (layer.optString("align", "center")) {
                "left" -> Paint.Align.LEFT
                "right" -> Paint.Align.RIGHT
                else -> Paint.Align.CENTER
            }
            // letterSpacing в Paint измеряется в em, у нас — в pt
            letterSpacing = (layer.optDouble("ls", 0.0).toFloat() / sizePt).coerceIn(-0.2f, 1f)
            if (glowRadius > 0f && Color.alpha(glowColor) > 0) {
                setShadowLayer(glowRadius, 0f, 0f, glowColor)
            }
        }
    }

    private fun drawCountdown(
        canvas: Canvas,
        layer: JSONObject,
        x: Float,
        y: Float,
        w: Float,
        h: Float,
        scale: Float,
        alpha: Int,
    ) {
        val targetMs = layer.optLong("targetMs", 0L)
        if (targetMs <= 0L) return

        val remaining = (targetMs - System.currentTimeMillis()).coerceAtLeast(0L)
        val totalSeconds = remaining / 1000L
        val values = longArrayOf(
            totalSeconds / 86_400L,
            (totalSeconds % 86_400L) / 3_600L,
            (totalSeconds % 3_600L) / 60L,
            totalSeconds % 60L,
        )

        val sizePt = layer.optDouble("size", 34.0).toFloat().coerceIn(6f, 200f)
        val digitColor = parseColor(layer.optString("color", DEFAULT_TEXT))
        val accentColor = parseColor(layer.optString("accentColor", "#FF35E0FF"))
        val font = typefaceFor(layer.optString("font", "mono"), true)
        val digitSize = sizePt * scale

        val digitPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = digitColor
            this.alpha = alpha
            textSize = digitSize
            typeface = font
            textAlign = Paint.Align.CENTER
        }
        val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = accentColor
            this.alpha = alpha
            textSize = digitSize * 0.26f
            typeface = font
            textAlign = Paint.Align.CENTER
            letterSpacing = 0.08f
        }

        // Заголовок над цифрами («ДО НОВОГО ГОДА»)
        val label = layer.optString("label", "")
        if (label.isNotEmpty()) {
            val headPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = accentColor
                this.alpha = alpha
                textSize = digitSize * 0.3f
                typeface = font
                textAlign = Paint.Align.CENTER
                letterSpacing = 0.12f
            }
            canvas.drawText(
                label.uppercase(Locale("ru")),
                x + w / 2f,
                y + h / 2f - digitSize * 0.62f,
                headPaint,
            )
        }

        val labels = arrayOf("ДН", "ЧАС", "МИН", "СЕК")
        val cellW = w / 4f
        val digitsBaseline = y + h / 2f + digitSize * 0.32f
        val cellLabelBaseline = digitsBaseline + digitSize * 0.42f

        for (i in 0 until 4) {
            val cx = x + cellW * (i + 0.5f)
            canvas.drawText(String.format(Locale.US, "%02d", values[i]), cx, digitsBaseline, digitPaint)
            canvas.drawText(labels[i], cx, cellLabelBaseline, labelPaint)
        }
    }

    private fun drawBattery(
        canvas: Canvas,
        context: Context,
        layer: JSONObject,
        x: Float,
        y: Float,
        w: Float,
        h: Float,
        scale: Float,
        alpha: Int,
    ) {
        val pct = batteryPercent(context).coerceIn(0, 100)
        val color = parseColor(layer.optString("color", DEFAULT_TEXT))
        val track = parseColor(layer.optString("trackColor", "#FF2A2F3B"))
        val showPercent = layer.optBoolean("showPercent", true)
        val style = layer.optString("style", "ring")
        val sizePt = layer.optDouble("size", 24.0).toFloat().coerceIn(6f, 200f)
        val font = typefaceFor(layer.optString("font", "system"), true)

        val percentPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            this.color = color
            this.alpha = alpha
            textSize = sizePt * scale
            typeface = font
            textAlign = Paint.Align.CENTER
        }
        val pctText = "$pct%"

        when (style) {
            "bar" -> {
                val barH = (h * 0.18f).coerceAtLeast(6f * scale)
                val barTop = y + h - barH - h * 0.08f
                val radius = barH / 2f
                val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    this.color = track
                    this.alpha = alpha
                }
                canvas.drawRoundRect(RectF(x, barTop, x + w, barTop + barH), radius, radius, trackPaint)
                val fillW = w * pct / 100f
                if (fillW > barH * 0.5f) {
                    val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                        this.color = color
                        this.alpha = alpha
                    }
                    canvas.drawRoundRect(RectF(x, barTop, x + fillW, barTop + barH), radius, radius, fillPaint)
                }
                if (showPercent) {
                    val baseline = barTop - 8f * scale
                    canvas.drawText(pctText, x + w / 2f, baseline, percentPaint)
                }
            }
            "text" -> {
                if (showPercent) {
                    val baseline = y + h / 2f - (percentPaint.descent() + percentPaint.ascent()) / 2f
                    canvas.drawText(pctText, x + w / 2f, baseline, percentPaint)
                }
            }
            else -> {
                // ring: кольцо как в редакторе (r=40, stroke=9 в viewBox 100)
                val stroke = minOf(w, h) * 0.09f
                val radius = (minOf(w, h) - stroke) / 2f
                val cx = x + w / 2f
                val cy = y + h / 2f

                val trackPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    this.color = track
                    this.alpha = alpha
                    this.style = Paint.Style.STROKE
                    strokeWidth = stroke
                }
                canvas.drawCircle(cx, cy, radius, trackPaint)

                val arcPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    this.color = color
                    this.alpha = alpha
                    this.style = Paint.Style.STROKE
                    strokeWidth = stroke
                    strokeCap = Paint.Cap.ROUND
                }
                canvas.drawArc(
                    RectF(cx - radius, cy - radius, cx + radius, cy + radius),
                    -90f,
                    pct * 3.6f,
                    false,
                    arcPaint,
                )
                if (showPercent) {
                    val baseline = cy - (percentPaint.descent() + percentPaint.ascent()) / 2f
                    canvas.drawText(pctText, cx, baseline, percentPaint)
                }
            }
        }
    }

    // ------------------------------------------------------------- live text

    private fun clockText(layer: JSONObject): String {
        val format24 = layer.optBoolean("format24", true)
        val withSeconds = layer.optBoolean("showSeconds", false)
        val pattern = when {
            format24 && withSeconds -> "HH:mm:ss"
            format24 -> "HH:mm"
            withSeconds -> "hh:mm:ss"
            else -> "hh:mm"
        }
        return try {
            SimpleDateFormat(pattern, Locale.US).format(Date())
        } catch (t: Throwable) {
            ""
        }
    }

    private fun dateText(layer: JSONObject): String {
        val pattern = layer.optString("jpattern", "d MMMM")
        return try {
            SimpleDateFormat(pattern, Locale("ru")).format(Date())
        } catch (t: Throwable) {
            ""
        }
    }

    private fun batteryPercent(context: Context): Int {
        return try {
            val intent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            if (intent == null) {
                75
            } else {
                val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
                if (level >= 0 && scale > 0) ((level.toFloat() / scale.toFloat()) * 100f).toInt() else 75
            }
        } catch (t: Throwable) {
            75
        }
    }

    // ---------------------------------------------------------------- helpers

    private fun readSpec(dir: File): JSONObject? {
        return try {
            val file = File(dir, "spec.json")
            if (!file.exists()) null else JSONObject(file.readText())
        } catch (t: Throwable) {
            null
        }
    }

    private fun widgetDir(context: Context): File {
        val dir = File(context.filesDir, DIR)
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    private fun placeholder(context: Context, message: String): Bitmap {
        val density = context.resources.displayMetrics.density.coerceIn(1f, 4f)
        val size = (110 * density).toInt().coerceAtLeast(64)
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.parseColor("#140D1017"))
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.parseColor("#8035E0FF")
            textSize = size * 0.11f
            textAlign = Paint.Align.CENTER
            typeface = Typeface.DEFAULT_BOLD
        }
        val lines = ArrayList<String>()
        var line = ""
        for (word in message.split(" ")) {
            val candidate = if (line.isEmpty()) word else "$line $word"
            if (paint.measureText(candidate) > size * 0.86f && line.isNotEmpty()) {
                lines.add(line)
                line = word
            } else {
                line = candidate
            }
        }
        if (line.isNotEmpty()) lines.add(line)
        var baseline = size / 2f - (lines.size - 1) * paint.textSize * 0.6f
        for (l in lines) {
            canvas.drawText(l, size / 2f, baseline, paint)
            baseline += paint.textSize * 1.2f
        }
        return bitmap
    }

    private fun typefaceFor(font: String, bold: Boolean): Typeface {
        val base = when (font) {
            "mono" -> Typeface.MONOSPACE
            "serif" -> Typeface.SERIF
            else -> Typeface.DEFAULT
        }
        return Typeface.create(base, if (bold) Typeface.BOLD else Typeface.NORMAL)
    }

    /** Цвета проекта — #RRGGBB или #RRGGBBAA (альфа последним, в отличие от Android). */
    private fun parseColor(hex: String): Int {
        val value = hex.trim().removePrefix("#")
        return try {
            when (value.length) {
                6 -> (0xFF000000.toInt()) or value.toLong(16).toInt()
                8 -> {
                    val rgb = value.substring(0, 6).toLong(16).toInt()
                    val alpha = value.substring(6, 8).toLong(16).toInt()
                    (alpha shl 24) or rgb
                }
                3 -> Color.parseColor("#$value")
                else -> Color.WHITE
            }
        } catch (t: Throwable) {
            Color.WHITE
        }
    }
}
