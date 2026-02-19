package com.habittracker.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Capacitor Plugin для фонового крокоміра.
 * Взаємодіє з StepCounterService для підрахунку кроків у фоні.
 */
@CapacitorPlugin(
    name = "BackgroundStepCounter",
    permissions = {
        @Permission(
            alias = "activity",
            strings = { Manifest.permission.ACTIVITY_RECOGNITION }
        ),
        @Permission(
            alias = "bodySensors",
            strings = { Manifest.permission.BODY_SENSORS }
        )
    }
)
public class StepCounterPlugin extends Plugin {

    private static final String TAG = "StepCounterPlugin";
    private static final String PREFS_NAME = "StepCounterPrefs";
    private static final int PERMISSION_REQUEST_CODE = 1001;
    
    private boolean isServiceRunning = false;
    private PluginCall pendingCall = null;

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "🔌 StepCounterPlugin loaded");
        
        // Встановлюємо listener для оновлень
        StepCounterService.setStepUpdateListener(steps -> {
            // Надсилаємо подію в JavaScript
            JSObject data = new JSObject();
            data.put("steps", steps);
            notifyListeners("stepUpdate", data);
        });
    }

    /**
     * Перевірка доступності апаратного крокоміра
     */
    @PluginMethod
    public void isAvailable(PluginCall call) {
        Context context = getContext();
        PackageManager pm = context.getPackageManager();
        
        boolean hasStepCounter = pm.hasSystemFeature(PackageManager.FEATURE_SENSOR_STEP_COUNTER);
        boolean hasStepDetector = pm.hasSystemFeature(PackageManager.FEATURE_SENSOR_STEP_DETECTOR);
        boolean hasAccelerometer = pm.hasSystemFeature(PackageManager.FEATURE_SENSOR_ACCELEROMETER);
        
        JSObject result = new JSObject();
        result.put("available", hasStepCounter || hasStepDetector || hasAccelerometer);
        result.put("hasStepCounter", hasStepCounter);
        result.put("hasStepDetector", hasStepDetector);
        result.put("hasAccelerometer", hasAccelerometer);
        result.put("isNative", hasStepCounter || hasStepDetector);
        
        Log.d(TAG, "📱 isAvailable: " + result.toString());
        call.resolve(result);
    }

    /**
     * Запит дозволів
     */
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        Log.d(TAG, "🔐 Requesting permissions...");
        
        boolean needActivityRecognition = false;
        
        // Android 10+ потребує ACTIVITY_RECOGNITION для крокоміра
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACTIVITY_RECOGNITION) 
                    != PackageManager.PERMISSION_GRANTED) {
                needActivityRecognition = true;
            }
        }
        
        Log.d(TAG, "Need Activity Recognition: " + needActivityRecognition);
        
        if (needActivityRecognition) {
            pendingCall = call;
            requestPermissionForAlias("activity", call, "handlePermissionResult");
            return;
        }
        
        // Дозволи вже надані (або Android < 10)
        JSObject result = new JSObject();
        result.put("granted", true);
        result.put("activityRecognition", true);
        Log.d(TAG, "✅ All permissions already granted");
        call.resolve(result);
    }

    @PermissionCallback
    private void handlePermissionResult(PluginCall call) {
        boolean activityGranted = true;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            activityGranted = ContextCompat.checkSelfPermission(getContext(), 
                Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
        }
        
        JSObject result = new JSObject();
        result.put("granted", activityGranted);
        result.put("activityRecognition", activityGranted);
        
        if (activityGranted) {
            Log.d(TAG, "✅ ACTIVITY_RECOGNITION granted");
        } else {
            Log.w(TAG, "❌ ACTIVITY_RECOGNITION denied");
        }
        
        call.resolve(result);
    }

    /**
     * Запуск фонового сервісу крокоміра
     */
    @PluginMethod
    public void start(PluginCall call) {
        Log.d(TAG, "🚀 Starting StepCounterService...");
        
        // Перевірка дозволів
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACTIVITY_RECOGNITION) 
                    != PackageManager.PERMISSION_GRANTED) {
                call.reject("ACTIVITY_RECOGNITION permission not granted");
                return;
            }
        }
        
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, StepCounterService.class);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            
            isServiceRunning = true;
            
            JSObject result = new JSObject();
            result.put("started", true);
            call.resolve(result);
            
            Log.d(TAG, "✅ Service started");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to start service", e);
            call.reject("Failed to start service: " + e.getMessage());
        }
    }

    /**
     * Зупинка фонового сервісу
     */
    @PluginMethod
    public void stop(PluginCall call) {
        Log.d(TAG, "⏹️ Stopping StepCounterService...");
        
        try {
            Context context = getContext();
            Intent serviceIntent = new Intent(context, StepCounterService.class);
            context.stopService(serviceIntent);
            
            isServiceRunning = false;
            
            JSObject result = new JSObject();
            result.put("stopped", true);
            call.resolve(result);
            
            Log.d(TAG, "✅ Service stopped");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to stop service", e);
            call.reject("Failed to stop service: " + e.getMessage());
        }
    }

    /**
     * Отримання поточної кількості кроків
     */
    @PluginMethod
    public void getSteps(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        
        int steps = prefs.getInt("steps_today", 0);
        String lastDate = prefs.getString("last_date", "");
        String today = getTodayDate();
        
        // Перевірка чи не новий день
        if (!today.equals(lastDate)) {
            steps = 0;
        }
        
        JSObject result = new JSObject();
        result.put("steps", steps);
        result.put("date", today);
        result.put("isServiceRunning", isServiceRunning);
        
        call.resolve(result);
    }

    /**
     * Встановлення мети кроків
     */
    @PluginMethod
    public void setStepGoal(PluginCall call) {
        int goal = call.getInt("goal", 10000);
        
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putInt("step_goal", goal).apply();
        
        JSObject result = new JSObject();
        result.put("goal", goal);
        call.resolve(result);
        
        Log.d(TAG, "🎯 Step goal set to: " + goal);
    }

    /**
     * Перевірка статусу сервісу
     */
    @PluginMethod
    public void isRunning(PluginCall call) {
        JSObject result = new JSObject();
        result.put("running", isServiceRunning);
        call.resolve(result);
    }

    /**
     * Скидання лічильника (для тестування)
     */
    @PluginMethod
    public void reset(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putInt("steps_today", 0)
            .putString("last_date", getTodayDate())
            .putFloat("initial_sensor_steps", -1)
            .apply();
        
        JSObject result = new JSObject();
        result.put("reset", true);
        call.resolve(result);
        
        Log.d(TAG, "🔄 Counter reset");
    }

    /**
     * Перевірка поточного стану дозволів
     */
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();
        
        boolean activityGranted = true;
        
        // Для крокоміра потрібен тільки ACTIVITY_RECOGNITION на Android 10+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            activityGranted = ContextCompat.checkSelfPermission(getContext(), 
                Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
        }
        
        result.put("granted", activityGranted);
        result.put("activityRecognition", activityGranted);
        
        Log.d(TAG, "🔐 Check permissions: granted=" + activityGranted);
        call.resolve(result);
    }

    /**
     * Відкриває налаштування застосунку в системі
     */
    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Context context = getContext();
            Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(android.net.Uri.fromParts("package", context.getPackageName(), null));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            
            JSObject result = new JSObject();
            result.put("opened", true);
            call.resolve(result);
            
            Log.d(TAG, "⚙️ Opened app settings");
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to open settings: " + e.getMessage());
            call.reject("Failed to open settings: " + e.getMessage());
        }
    }
    
    /**
     * Запит на ігнорування оптимізації батареї
     */
    @PluginMethod
    public void requestIgnoreBatteryOptimization(PluginCall call) {
        try {
            Context context = getContext();
            String packageName = context.getPackageName();
            
            android.os.PowerManager pm = (android.os.PowerManager) context.getSystemService(Context.POWER_SERVICE);
            
            boolean isIgnoring = false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                isIgnoring = pm.isIgnoringBatteryOptimizations(packageName);
            }
            
            if (!isIgnoring && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(android.net.Uri.parse("package:" + packageName));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
            
            JSObject result = new JSObject();
            result.put("requested", true);
            result.put("alreadyIgnoring", isIgnoring);
            call.resolve(result);
            
            Log.d(TAG, "🔋 Battery optimization: alreadyIgnoring=" + isIgnoring);
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to request battery optimization: " + e.getMessage());
            call.reject("Failed: " + e.getMessage());
        }
    }
    
    /**
     * Перевірка стану оптимізації батареї
     */
    @PluginMethod
    public void checkBatteryOptimization(PluginCall call) {
        try {
            Context context = getContext();
            String packageName = context.getPackageName();
            
            android.os.PowerManager pm = (android.os.PowerManager) context.getSystemService(Context.POWER_SERVICE);
            
            boolean isIgnoring = false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                isIgnoring = pm.isIgnoringBatteryOptimizations(packageName);
            }
            
            JSObject result = new JSObject();
            result.put("isIgnoringBatteryOptimization", isIgnoring);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to check battery optimization: " + e.getMessage());
            call.reject("Failed: " + e.getMessage());
        }
    }
    
    /**
     * Детальна діагностика сенсорів
     */
    @PluginMethod
    public void getSensorDiagnostics(PluginCall call) {
        Context context = getContext();
        android.hardware.SensorManager sm = (android.hardware.SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
        
        android.hardware.Sensor stepCounter = sm.getDefaultSensor(android.hardware.Sensor.TYPE_STEP_COUNTER);
        android.hardware.Sensor stepDetector = sm.getDefaultSensor(android.hardware.Sensor.TYPE_STEP_DETECTOR);
        android.hardware.Sensor accelerometer = sm.getDefaultSensor(android.hardware.Sensor.TYPE_ACCELEROMETER);
        
        JSObject result = new JSObject();
        result.put("hasStepCounter", stepCounter != null);
        result.put("hasStepDetector", stepDetector != null);
        result.put("hasAccelerometer", accelerometer != null);
        
        if (stepCounter != null) {
            result.put("stepCounterName", stepCounter.getName());
            result.put("stepCounterVendor", stepCounter.getVendor());
        }
        if (stepDetector != null) {
            result.put("stepDetectorName", stepDetector.getName());
            result.put("stepDetectorVendor", stepDetector.getVendor());
        }
        
        // Перевіряємо стан сервісу
        result.put("isServiceRunning", isServiceRunning);
        
        // Android версія
        result.put("androidVersion", Build.VERSION.SDK_INT);
        result.put("manufacturer", Build.MANUFACTURER);
        result.put("model", Build.MODEL);
        
        Log.d(TAG, "📊 Sensor diagnostics: " + result.toString());
        call.resolve(result);
    }

    private String getTodayDate() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        return sdf.format(new Date());
    }
}
