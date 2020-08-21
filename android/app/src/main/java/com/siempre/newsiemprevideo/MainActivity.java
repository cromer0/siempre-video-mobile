package com.siempre.newsiemprevideo;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.InstanceIdResult;

public class MainActivity extends ReactActivity {
  private static final String TAG = "MainActivity";

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "SiempreVideoMobile";
  }

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    FirebaseFirestore db = FirebaseFirestore.getInstance();

    FirebaseInstanceId.getInstance().getInstanceId()
      .addOnCompleteListener(new OnCompleteListener<InstanceIdResult>() {
        @Override
        public void onComplete(@NonNull Task<InstanceIdResult> task) {
          Log.d(TAG, "here in onCreate");
          String token = task.getResult().getToken();
          Log.d(TAG, token);

          FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
          if (user != null) {
            Log.d(TAG, "user is not null");
            db.collection("users").document(user.getUid()).update("FCMToken", token);
          } else {
            Log.d(TAG, "user is null");
          }
      }
      });
  }

  public static class TestActivityDelegate extends ReactActivityDelegate {
    private static final String TEST = "test";
    private Bundle mInitialProps = null;
    private final
    @Nullable
    Activity mActivity;

    public TestActivityDelegate(Activity activity, String mainComponentName) {
      super(activity, mainComponentName);
      this.mActivity = activity;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
      Bundle bundle = mActivity.getIntent().getExtras();
      if (bundle != null && bundle.containsKey(TEST)) {
        mInitialProps = new Bundle();
        mInitialProps.putString(TEST, bundle.getString(TEST));
      }
      super.onCreate(savedInstanceState);
    }

    @Override
    protected Bundle getLaunchOptions() {
      return mInitialProps;
    }
  }

  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new TestActivityDelegate(this, getMainComponentName());
  }
}
