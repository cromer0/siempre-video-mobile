package com.siempre.newsiemprevideo;

import android.content.Intent;
import android.os.Bundle;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

import javax.annotation.Nullable;

public class EnterCallTaskService extends HeadlessJsTaskService {
    @Override
    protected @Nullable HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        Bundle extras = intent.getExtras();
        if (extras != null) {
            return new HeadlessJsTaskConfig(
                    "EnterCallTask",
                    Arguments.fromBundle(extras),
                    5000, // timeout for the task. TODO: make sure that this number is ok
                    false
            );
        }
        return null;
    }
}
