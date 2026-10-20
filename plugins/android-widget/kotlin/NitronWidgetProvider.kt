package com.nitron.widgetstudio.nitron

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.SystemClock
import android.widget.RemoteViews
import com.nitron.widgetstudio.R

/**
 * Провайдер домашнего виджета Nitron.
 *
 * Приложение кладёт в filesDir/nitron_widgets/ два файла:
 *  - base.png  — отрисованный дизайн без «живых» слоёв (прозрачность сохранена)
 *  - spec.json — геометрия и параметры живых слоёв (часы, дата, отсчёт, батарея)
 *
 * Виджет рисует bitmap и раз в минуту обновляет его, чтобы часы шли.
 */
class NitronWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (id in appWidgetIds) {
            renderWidget(context, appWidgetManager, id)
        }
        scheduleTick(context)
        syncLiveService(context)
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle,
    ) {
        renderWidget(context, appWidgetManager, appWidgetId)
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        scheduleTick(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        cancelTick(context)
        NitronLiveService.stop(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action != ACTION_TICK) return
        try {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, NitronWidgetProvider::class.java))
            if (ids.isEmpty()) {
                cancelTick(context)
                return
            }
            for (id in ids) {
                renderWidget(context, manager, id)
            }
            syncLiveService(context)
        } catch (t: Throwable) {
            // Никогда не падаем в broadcast: лаунчер покажет ошибку виджета.
        }
    }

    companion object {
        const val ACTION_TICK = "com.nitron.widgetstudio.nitron.TICK"
        private const val TICK_MS = 60_000L

        private fun renderWidget(context: Context, manager: AppWidgetManager, widgetId: Int) {
            try {
                val bitmap = NitronRenderer.render(context)
                val views = RemoteViews(context.packageName, R.layout.nitron_widget)
                if (bitmap != null) {
                    views.setImageViewBitmap(R.id.nitron_widget_image, bitmap)
                }
                manager.updateAppWidget(widgetId, views)
            } catch (t: Throwable) {
                // Битый спек/файл — виджет просто останется пустым.
            }
        }

        private fun tickIntent(context: Context): PendingIntent {
            val intent = Intent(context, NitronWidgetProvider::class.java).setAction(ACTION_TICK)
            val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            return PendingIntent.getBroadcast(context, 0, intent, flags)
        }

        fun scheduleTick(context: Context) {
            try {
                val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                val first = SystemClock.elapsedRealtime() + TICK_MS
                alarm.setInexactRepeating(AlarmManager.ELAPSED_REALTIME, first, TICK_MS, tickIntent(context))
            } catch (t: Throwable) {
                // без будильника виджет просто не будет тикать
            }
        }

        /** Включает/выключает живой сервис в зависимости от наличия GIF/видео. */
        fun syncLiveService(context: Context) {
            if (NitronRenderer.isAnimated(context)) {
                NitronLiveService.start(context)
            } else {
                NitronLiveService.stop(context)
            }
        }

        fun cancelTick(context: Context) {
            try {
                val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                alarm.cancel(tickIntent(context))
            } catch (t: Throwable) {
            }
        }
    }
}
