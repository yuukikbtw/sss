package com.habittracker.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Реєструємо кастомний плагін крокоміра
        registerPlugin(StepCounterPlugin.class);
        
        super.onCreate(savedInstanceState);
    }
}
