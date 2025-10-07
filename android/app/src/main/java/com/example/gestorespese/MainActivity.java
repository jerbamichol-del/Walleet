package com.example.gestorespese;

import android.Manifest;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Controlla permesso microfono
        if (!this.hasPermission(Manifest.permission.RECORD_AUDIO)) {
            this.requestPermission(Manifest.permission.RECORD_AUDIO, 100);
        }
    }
}
