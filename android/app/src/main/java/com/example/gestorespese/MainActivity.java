package com.example.gestorespese;

import android.os.Bundle;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.webkit.WebView; // <<-- abilitare debug WebView

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.community.speechrecognition.SpeechRecognition;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSION_RECORD_AUDIO = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Abilita WebView remote debugging (console.log -> logcat)
        WebView.setWebContentsDebuggingEnabled(true);
        System.out.println("MainActivity: WebView debugging abilitato");

        // Registra il plugin SpeechRecognition per Capacitor
        registerPlugin(SpeechRecognition.class);

        // Chiedi permesso runtime microfono se non concesso
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                new String[]{Manifest.permission.RECORD_AUDIO},
                PERMISSION_RECORD_AUDIO
            );
        }
    }

    // Gestisci la risposta dell’utente ai permessi
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_RECORD_AUDIO) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // Permesso concesso
                System.out.println("Permesso microfono concesso.");
            } else {
                // Permesso negato
                System.out.println("Permesso microfono negato!");
            }
        }
    }
}
