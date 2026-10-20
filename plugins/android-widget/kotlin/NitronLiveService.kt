package com.nitron.widgetstudio.nitron

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.widget.RemoteViews
import androidx.core.app.NotificationCompat
import com.nitron.widgetstudio.MainActivity
import com.nitron.widgetstudio.R
import kotlin.concurrent.thread

/**
 * Держит виджет «живым»: 12 раз в секунду декодирует кадр GIF/видео
 * и отправляет его лаунчеру. RemoteViews не поддерживает анимацию,
 * поэтому единственный рабочий путь — постоянные updateAppWidget.
 *
 * Работает как foreground service, чтобы Android не убил процесс.
 */
class NitronLiveService : Service() {

    @Volatile
    private var running = false
    private var worker: Thread? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startAsForeground()
        if (!running) {
            running = true
            worker = thread(name = "nitron-widget-frames") { frameLoop() }
        }
        return START_STICKY
    }

    private fun frameLoop() {
        val manager = AppWidgetManager.getInstance(this)
        val component = ComponentName(this, NitronWidgetProvider::class.java)
        var emptyTicks = 0

        while (running) {
            val started = System.currentTimeMillis()
            try {
                val ids = manager.getAppWidgetIds(component)
                if (ids.isEmpty()) {
                    emptyTicks++
                    if (emptyTicks > 8) {
                        stopSelf()
                        break
                    }
                } else {
                    emptyTicks = 0
                    if (!NitronRenderer.isAnimated(this)) {
                        // медиа больше нет — дальше виджет обновляет провайдер по расписанию
                        stopSelf()
                        break
                    }
                    val bitmap = NitronRenderer.render(this, System.currentTimeMillis())
                    if (bitmap != null) {
                        val views = RemoteViews(packageName, R.layout.nitron_widget)
                        views.setImageViewBitmap(R.id.nitron_widget_image, bitmap)
                        for (id in ids) {
                            try {
                                manager.updateAppWidget(id, views)
                            } catch (t: Throwable) {
                            }
                        }
                    }
                }
            } catch (t: Throwable) {
                // не роняем сервис из-за одного кадра
            }

            val spent = System.currentTimeMillis() - started
            val sleep = (FRAME_MS - spent).coerceAtLeast(16L)
            try {
                Thread.sleep(sleep)
            } catch (e: InterruptedException) {
                break
            }
        }

        NitronMedia.release()
        running = false
    }

    private fun startAsForeground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (nm.getNotificationChannel(CHANNEL_ID) == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Живой виджет",
                    NotificationManager.IMPORTANCE_LOW,
                )
                channel.setShowBadge(false)
                nm.createNotificationChannel(channel)
            }
        }

        val open = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Nitron: живой виджет")
            .setContentText("GIF и видео играют на домашнем экране")
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentIntent(open)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
        } else {
            startForeground(NOTIF_ID, notification)
        }
    }

    override fun onDestroy() {
        running = false
        worker?.interrupt()
        worker = null
        try {
            stopForeground(true)
        } catch (t: Throwable) {
        }
        super.onDestroy()
    }

    companion object {
        private const val CHANNEL_ID = "nitron_live_widget"
        private const val NOTIF_ID = 4242
        private const val FRAME_MS = 83L

        fun start(context: Context) {
            try {
                val intent = Intent(context, NitronLiveService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (t: Throwable) {
                // без сервиса виджет останется статичным
            }
        }

        fun stop(context: Context) {
            try {
                context.stopService(Intent(context, NitronLiveService::class.java))
            } catch (t: Throwable) {
            }
        }
    }
}
