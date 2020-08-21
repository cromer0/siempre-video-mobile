package com.siempre.newsiemprevideo;
import android.app.Application;
import android.app.Notification;
import android.app.Service;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothProfile;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;
import android.speech.tts.TextToSpeech;
import android.util.Log;

import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.*;
import com.google.firebase.firestore.FirebaseFirestore;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

public class BluetoothDetectionService extends Service {
    private static final String TAG = "BluetoothReceiverServ";
    public static final String ACTION_HEADSET_ON = "ACTION_HEADSET_ON";
    public static final String ACTION_HEADSET_OFF = "ACTION_HEADSET_OFF";
    public static final String ACTION_STATUS_CHANGED = "ACTION_STATUS_CHANGED";
    public static final String STATUS_CHANGE_EXTRA = "STATUS_CHANGE_EXTRA";
    public static final String STATUS_CHANGE_NAME_EXTRA = "STATUS_CHANGE_NAME_EXTRA";

    public static int NOTIFICATION_ID = 3;

    Context context;
    FirebaseFirestore db;
    FirebaseAuth mAuth;

    private boolean myTTSReady = false;
    private TextToSpeech myTTS;
    private ArrayList<String> bufferedUtterances;

    public void onCreate() {
        Log.d(TAG, "onCreate");
        super.onCreate();
        Application myApplication = this.getApplication();

        context = getApplicationContext();
        db = FirebaseFirestore.getInstance();
        //myTTS = new TextToSpeech(myApplication, textListener);

        mAuth = FirebaseAuth.getInstance();

        /*
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification notification = new Notification.Builder(this, NotificationService.CHANNEL_ID)
                    .setContentTitle("SiempreOne")
                    .setContentText("Updated status")
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .build();
            startForeground(NOTIFICATION_ID, notification);
        }
        */
    }

    public int onStartCommand(final Intent intent, int flags, int startId) {
        Log.d(TAG, "onstartcommand");

        String userId = mAuth.getCurrentUser().getUid();
        if (intent != null && !userId.equals("")) {
            String action = intent.getAction();
            Log.d(TAG, "intent is not null, action: " + action);
            if (action != null && action.equals(ACTION_HEADSET_ON)) {
                db.collection("users").document(userId).update("status", 0);
                /*
                db.collection("new-users")
                        .whereGreaterThanOrEqualTo("friends." + userId, "")
                        .get()
                        .addOnSuccessListener(new OnSuccessListener<QuerySnapshot>() {
                            @Override
                            public void onSuccess(QuerySnapshot queryDocumentSnapshots) {
                                List<DocumentSnapshot> docs = queryDocumentSnapshots.getDocuments();
                                ArrayList<String> availableFriends = new ArrayList<>();
                                for (DocumentSnapshot doc: docs) {
                                    HashMap<String, Object> data = (HashMap<String, Object>)doc.getData();
                                    if (((Long)data.get("status")).intValue() == 0) {
                                        availableFriends.add((String) data.get("name"));
                                    }
                                }

                                ArrayList<String> availableTexts = new ArrayList<>();
                                availableTexts.add("Turned available.");

                                if (availableFriends.size() > 0) {
                                    String friendsText = availableFriends.get(0);
                                    for (int i = 1; i < availableFriends.size(); i++) {
                                        friendsText += ", " + availableFriends.get(i);
                                    }
                                    if (availableFriends.size() == 1) {
                                        availableTexts.add(friendsText + " is free to talk.");
                                    } else {
                                        availableTexts.add(friendsText + " are free to talk.");
                                    }
                                }

                                try {
                                    Thread.sleep(3000);
                                } catch (Exception e) {
                                    Log.d(TAG, "trying thread sleep caught exception" + e.getLocalizedMessage());
                                }

                                if (myTTSReady) {
                                    sayTextArray(availableTexts);
                                } else {
                                    bufferedUtterances = availableTexts;
                                }
                            }
                        });
                    */
            } else if (action != null && action.equals(ACTION_HEADSET_OFF)) {
                db.collection("users").document(userId).update("status", 1);
            } else if (action != null && action.equals(ACTION_STATUS_CHANGED)) {
                /*
                db.collection("new-users").document(userId).get()
                        .addOnSuccessListener(new OnSuccessListener<DocumentSnapshot>() {
                            @Override
                            public void onSuccess(DocumentSnapshot documentSnapshot) {
                                Map<String, Object> data = documentSnapshot.getData();
                                String name = intent.getStringExtra(STATUS_CHANGE_NAME_EXTRA);
                                String status = intent.getStringExtra(STATUS_CHANGE_EXTRA);
                                ArrayList<String> toSay = new ArrayList<>();
                                if (status.equals("0")) {
                                    toSay.add(name + " just turned available");
                                } else if (status.equals("1")) {
                                    toSay.add(name + " just turned busy");
                                }
                                sayTextArray(toSay);
                            }
                        });
                */
            }
        }
        stopForeground(true);
        return super.onStartCommand(intent, flags, startId);
    }

    /*
    private void sayTextArray(ArrayList<String> utterances) {
        boolean BTconnected = (myBluetoothAdapter != null) && BluetoothProfile.STATE_CONNECTED == myBluetoothAdapter.getProfileConnectionState(BluetoothProfile.HEADSET);
        SharedPreferences prefs = getSharedPreferences(Constants.PREFS, MODE_PRIVATE);
        boolean isEnabled = prefs.getBoolean("voiceEnabled", true);
        if (BTconnected && isEnabled) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                for (int i = 0; i < utterances.size(); i++) {
                    Log.d(TAG, utterances.get(i));
                    myTTS.speak(utterances.get(i), TextToSpeech.QUEUE_ADD, null, i + "");
                }
            } else {
                for (int i = 0; i < utterances.size(); i++) {
                    myTTS.speak(utterances.get(i), TextToSpeech.QUEUE_ADD, null);
                }
            }
        }
    }

    public TextToSpeech.OnInitListener textListener = new TextToSpeech.OnInitListener() {
        @Override
        public void onInit(int status) {
            if (status == TextToSpeech.SUCCESS) {
                myTTSReady = true;
                if (bufferedUtterances != null) {
                    sayTextArray(bufferedUtterances);
                    bufferedUtterances = null;
                }
            }
        }
    };
    */

    @Override
    public IBinder onBind(Intent intent) {
        // TODO: Return the communication channel to the service.
        throw new UnsupportedOperationException("Not yet implemented");
    }
}
