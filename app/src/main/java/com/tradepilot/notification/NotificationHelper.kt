package com.tradepilot.notification

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object NotificationHelper {
    private const val CHANNEL_ID = "tradepilot_paper_alerts"
    private const val CHANNEL_NAME = "TradePilot Paper Alerts"
    private const val CHANNEL_DESC = "Notifications for paper risk limits, strategy drift, and system health"

    private const val CHANNEL_RESEARCH_ID = "tradepilot_research_alerts"
    private const val CHANNEL_RESEARCH_NAME = "TradePilot Research & Ensemble Alerts"
    private const val CHANNEL_RESEARCH_DESC = "Notifications for strategy conflicts, parameter cliffs, and stage divergences"

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager: NotificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH).apply {
                description = CHANNEL_DESC
            }
            notificationManager.createNotificationChannel(channel)

            val researchChannel = NotificationChannel(CHANNEL_RESEARCH_ID, CHANNEL_RESEARCH_NAME, NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = CHANNEL_RESEARCH_DESC
            }
            notificationManager.createNotificationChannel(researchChannel)
        }
    }

    fun showNotification(
        context: Context,
        notificationId: Int,
        title: String,
        body: String,
        category: String = "PAPER_ALERT"
    ) {
        createNotificationChannel(context)

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("[$category] $title")
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)

        try {
            with(NotificationManagerCompat.from(context)) {
                notify(notificationId, builder.build())
            }
        } catch (e: SecurityException) {
            // Permission not granted on Android 13+
        }
    }
}
