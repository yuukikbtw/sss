package com.habittracker.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Foreground Service для підрахунку кроків у фоні.
 * Працює навіть коли екран вимкнений або застосунок згорнутий.
 */
public class StepCounterService extends Service implements SensorEventListener {

    private static final String TAG = "StepCounterService";
    private static final String CHANNEL_ID = "step_counter_channel";
    private static final int NOTIFICATION_ID = 1001;
    private static final String PREFS_NAME = "StepCounterPrefs";
    private static final String KEY_STEPS_TODAY = "steps_today";
    private static final String KEY_LAST_DATE = "last_date";
    private static final String KEY_INITIAL_SENSOR_STEPS = "initial_sensor_steps";
    private static final String KEY_STEP_GOAL = "step_goal";

    private SensorManager sensorManager;
    private Sensor stepCounterSensor;
    private Sensor stepDetectorSensor;
    private Sensor accelerometerSensor;
    private PowerManager.WakeLock wakeLock;
    private SharedPreferences prefs;
    
    // Лічильники
    private int stepsToday = 0;
    private int stepGoal = 10000;
    private float initialSensorSteps = -1;
    private String lastDate = "";
    
    // Для акселерометра (fallback)
    private boolean useAccelerometer = false;
    private AccelerometerStepDetector accelDetector;
    
    // Callback для оновлення UI
    private static StepUpdateListener stepUpdateListener;

    public interface StepUpdateListener {
        void onStepUpdate(int steps);
    }

    public static void setStepUpdateListener(StepUpdateListener listener) {
        stepUpdateListener = listener;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "🚀 StepCounterService onCreate");
        
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        loadState();
        
        // Ініціалізація сенсорів
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        
        // Пробуємо використати апаратний крокомір
        stepCounterSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        stepDetectorSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR);
        
        if (stepCounterSensor == null && stepDetectorSensor == null) {
            // Fallback на акселерометр
            Log.w(TAG, "⚠️ Апаратний крокомір недоступний, використовуємо акселерометр");
            accelerometerSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            useAccelerometer = true;
            accelDetector = new AccelerometerStepDetector();
        }
        
        // Acquire WakeLock для роботи з вимкненим екраном
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "HabitTracker:StepCounterWakeLock"
        );
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "🚀 StepCounterService onStartCommand");
        
        // Створюємо notification channel
        createNotificationChannel();
        
        // Запускаємо як Foreground Service
        Notification notification = buildNotification();
        startForeground(NOTIFICATION_ID, notification);
        
        // Реєструємо сенсори
        registerSensors();
        
        // Acquire WakeLock
        if (wakeLock != null && !wakeLock.isHeld()) {
            wakeLock.acquire(10 * 60 * 60 * 1000L); // 10 годин максимум
            Log.d(TAG, "🔒 WakeLock acquired");
        }
        
        return START_STICKY; // Перезапуск сервісу якщо система його вб'є
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "❌ StepCounterService onDestroy");
        
        // Відписуємось від сенсорів
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        
        // Звільняємо WakeLock
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d(TAG, "🔓 WakeLock released");
        }
        
        // Зберігаємо стан
        saveState();
        
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // ============================================
    // SENSOR CALLBACKS
    // ============================================
    
    @Override
    public void onSensorChanged(SensorEvent event) {
        checkDateReset();
        
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            // Апаратний крокомір - повертає загальну кількість кроків з перезавантаження
            float totalSteps = event.values[0];
            
            if (initialSensorSteps < 0) {
                // Перший раз - запам'ятовуємо початкове значення
                initialSensorSteps = totalSteps - stepsToday;
                saveState();
            }
            
            int newSteps = (int) (totalSteps - initialSensorSteps);
            if (newSteps > stepsToday) {
                stepsToday = newSteps;
                onStepDetected();
            }
            
        } else if (event.sensor.getType() == Sensor.TYPE_STEP_DETECTOR) {
            // Детектор кроків - викликається на кожен крок
            stepsToday++;
            onStepDetected();
            
        } else if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER && useAccelerometer) {
            // Акселерометр fallback
            if (accelDetector.processAcceleration(event.values[0], event.values[1], event.values[2])) {
                stepsToday++;
                onStepDetected();
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Не потрібно обробляти
    }

    // ============================================
    // HELPERS
    // ============================================
    
    private void registerSensors() {
        if (useAccelerometer && accelerometerSensor != null) {
            sensorManager.registerListener(
                this, 
                accelerometerSensor, 
                SensorManager.SENSOR_DELAY_GAME
            );
            Log.d(TAG, "📱 Accelerometer зареєстровано");
        } else {
            if (stepCounterSensor != null) {
                sensorManager.registerListener(
                    this, 
                    stepCounterSensor, 
                    SensorManager.SENSOR_DELAY_FASTEST
                );
                Log.d(TAG, "📱 Step Counter зареєстровано");
            }
            if (stepDetectorSensor != null) {
                sensorManager.registerListener(
                    this, 
                    stepDetectorSensor, 
                    SensorManager.SENSOR_DELAY_FASTEST
                );
                Log.d(TAG, "📱 Step Detector зареєстровано");
            }
        }
    }

    private void onStepDetected() {
        // Зберігаємо кожні 10 кроків
        if (stepsToday % 10 == 0) {
            saveState();
        }
        
        // Оновлюємо notification кожні 50 кроків
        if (stepsToday % 50 == 0) {
            updateNotification();
        }
        
        // Повідомляємо listener
        if (stepUpdateListener != null) {
            stepUpdateListener.onStepUpdate(stepsToday);
        }
        
        Log.d(TAG, "👣 Кроків: " + stepsToday);
    }
    
    private void checkDateReset() {
        String today = getTodayDate();
        if (!today.equals(lastDate)) {
            Log.d(TAG, "📅 Новий день, скидаємо лічильник");
            stepsToday = 0;
            initialSensorSteps = -1; // Скинути для перерахунку
            lastDate = today;
            saveState();
        }
    }
    
    private String getTodayDate() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        return sdf.format(new Date());
    }

    private void loadState() {
        stepsToday = prefs.getInt(KEY_STEPS_TODAY, 0);
        lastDate = prefs.getString(KEY_LAST_DATE, getTodayDate());
        initialSensorSteps = prefs.getFloat(KEY_INITIAL_SENSOR_STEPS, -1);
        stepGoal = prefs.getInt(KEY_STEP_GOAL, 10000);
        
        // Перевіряємо чи не новий день
        checkDateReset();
        
        Log.d(TAG, "📂 Завантажено: steps=" + stepsToday + ", date=" + lastDate);
    }

    private void saveState() {
        prefs.edit()
            .putInt(KEY_STEPS_TODAY, stepsToday)
            .putString(KEY_LAST_DATE, lastDate)
            .putFloat(KEY_INITIAL_SENSOR_STEPS, initialSensorSteps)
            .putInt(KEY_STEP_GOAL, stepGoal)
            .apply();
    }

    // ============================================
    // NOTIFICATIONS
    // ============================================
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Крокомір",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Підрахунок кроків у фоні");
            channel.setShowBadge(false);
            channel.enableVibration(false);
            channel.setSound(null, null);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            notificationIntent, 
            PendingIntent.FLAG_IMMUTABLE
        );

        int progress = Math.min((stepsToday * 100) / stepGoal, 100);
        String progressText = stepsToday + " / " + stepGoal + " кроків (" + progress + "%)";

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🚶 Крокомір активний")
            .setContentText(progressText)
            .setSmallIcon(android.R.drawable.ic_menu_directions)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .setProgress(100, progress, false)
            .build();
    }

    private void updateNotification() {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification());
        }
    }

    // ============================================
    // PUBLIC API
    // ============================================
    
    public int getStepsToday() {
        return stepsToday;
    }

    public void setStepGoal(int goal) {
        this.stepGoal = goal;
        prefs.edit().putInt(KEY_STEP_GOAL, goal).apply();
        updateNotification();
    }

    // ============================================
    // ACCELEROMETER STEP DETECTOR (FALLBACK)
    // ============================================
    
    private static class AccelerometerStepDetector {
        private static final float GRAVITY = 9.81f;
        private static final float FILTER_ALPHA = 0.2f;
        private static final float STEP_THRESHOLD_LOW = 1.2f;
        private static final float STEP_THRESHOLD_HIGH = 2.5f;
        private static final float STEP_THRESHOLD_MAX = 15.0f;
        private static final long MIN_STEP_INTERVAL = 300;
        
        private float filteredMagnitude = GRAVITY;
        private long lastStepTime = 0;
        private String stepPhase = "idle";
        private float peakValue = 0;
        private long peakTime = 0;
        
        public boolean processAcceleration(float x, float y, float z) {
            float rawMagnitude = (float) Math.sqrt(x * x + y * y + z * z);
            filteredMagnitude = FILTER_ALPHA * rawMagnitude + (1 - FILTER_ALPHA) * filteredMagnitude;
            float deviation = Math.abs(filteredMagnitude - GRAVITY);
            long now = System.currentTimeMillis();
            
            if (now - lastStepTime < MIN_STEP_INTERVAL) {
                return false;
            }
            
            switch (stepPhase) {
                case "idle":
                    if (deviation > STEP_THRESHOLD_LOW && filteredMagnitude > peakValue) {
                        stepPhase = "rising";
                        peakValue = filteredMagnitude;
                        peakTime = now;
                    }
                    break;
                    
                case "rising":
                    if (filteredMagnitude > peakValue) {
                        peakValue = filteredMagnitude;
                        peakTime = now;
                    } else {
                        float peakDeviation = Math.abs(peakValue - GRAVITY);
                        if (peakDeviation >= STEP_THRESHOLD_HIGH && peakDeviation <= STEP_THRESHOLD_MAX) {
                            stepPhase = "falling";
                        } else if (peakDeviation < STEP_THRESHOLD_LOW) {
                            stepPhase = "idle";
                            peakValue = 0;
                        }
                    }
                    if (now - peakTime > 500) {
                        stepPhase = "idle";
                        peakValue = 0;
                    }
                    break;
                    
                case "falling":
                    if (deviation < STEP_THRESHOLD_LOW) {
                        lastStepTime = now;
                        stepPhase = "idle";
                        peakValue = 0;
                        return true; // КРОК!
                    }
                    if (now - peakTime > 800) {
                        stepPhase = "idle";
                        peakValue = 0;
                    }
                    break;
            }
            
            return false;
        }
    }
}
