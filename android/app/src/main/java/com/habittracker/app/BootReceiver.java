package com.habittracker.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

/**
 * BroadcastReceiver для автоматичного запуску крокоміра після перезавантаження пристрою.
 */
public class BootReceiver extends BroadcastReceiver {

    private static final String TAG = "BootReceiver";
    private static final String PREFS_NAME = "StepCounterPrefs";
    private static final String KEY_AUTO_START = "auto_start_enabled";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }

        String action = intent.getAction();
        Log.d(TAG, "📱 Received action: " + action);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            
            // Перевіряємо чи увімкнений автозапуск
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            boolean autoStartEnabled = prefs.getBoolean(KEY_AUTO_START, true);
            
            if (autoStartEnabled) {
                Log.d(TAG, "🚀 Auto-starting StepCounterService...");
                startStepCounterService(context);
            } else {
                Log.d(TAG, "⏸️ Auto-start is disabled");
            }
        }
    }

    private void startStepCounterService(Context context) {
        try {
            Intent serviceIntent = new Intent(context, StepCounterService.class);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            
            Log.d(TAG, "✅ StepCounterService started after boot");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to start service after boot", e);
        }
    }
}
