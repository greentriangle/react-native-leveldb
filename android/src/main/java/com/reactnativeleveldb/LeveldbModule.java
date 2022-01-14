package com.reactnativeleveldb;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import android.util.Log;


public class LeveldbModule extends ReactContextBaseJavaModule {
  static {
    System.loadLibrary("reactnativeleveldb");
  }

  private static native void initialize(long jsiPtr, String docDir);
  private static native void destruct();

  public LeveldbModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return "Leveldb";
  }

  public static void publicInitialize(ReactApplicationContext reactApplicationContext, JavaScriptContextHolder jsContext) {
    Log.i("Leveldb", "initializing leveldb");
    reactApplicationContext.runOnJSQueueThread(new Runnable() {
      @Override
      public void run() {
        LeveldbModule.initialize(jsContext.get(), reactApplicationContext.getFilesDir().getAbsolutePath());
      }
    });
  }

  @Override
  public void onCatalystInstanceDestroy() {
    Log.i("Leveldb", "Closing all leveldb iterators and instances");
    LeveldbModule.destruct();
  }
}
