package com.siempre.newsiemprevideo;

import android.bluetooth.BluetoothA2dp;
import android.bluetooth.BluetoothClass;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothHeadset;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class BluetoothConnectedReceiver extends BroadcastReceiver {
    private static final String TAG = "BluetoothReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "bluetoothreceiver received event");
        String action = intent.getAction();
        BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
        Context applicationContext = context.getApplicationContext();

        if (device.getBluetoothClass().getMajorDeviceClass() == BluetoothClass.Device.Major.AUDIO_VIDEO) {
            if (BluetoothDevice.ACTION_ACL_CONNECTED.equals(action)) {
                Log.d(TAG, "Received intent with acl connected");
                sendConnectionEvent(applicationContext, true);
            } else if (BluetoothDevice.ACTION_ACL_DISCONNECTED.equals(action)) {
                Log.d(TAG, "Received intent with acl disconnected");
                sendConnectionEvent(applicationContext, false);
            } else if (BluetoothA2dp.ACTION_CONNECTION_STATE_CHANGED.equals(action)) {
                Log.d(TAG, "Bluetooth a2dp action connection state changed");
            } else if (BluetoothHeadset.ACTION_CONNECTION_STATE_CHANGED.equals(action)) {
                Log.d(TAG, "Bluetooth headset action connection state changed");
            }
        }
    }

    private void sendConnectionEvent(Context context, boolean isConnected) {
        Intent i = new Intent(context, BluetoothDetectionService.class);
        if (isConnected) {
            i.setAction(BluetoothDetectionService.ACTION_HEADSET_ON);
        } else {
            i.setAction(BluetoothDetectionService.ACTION_HEADSET_OFF);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Log.d(TAG, "starting foreground service");
            context.startForegroundService(i);
        } else {
            Log.d(TAG, "starting service");
            context.startService(i);
        }
    }
}
