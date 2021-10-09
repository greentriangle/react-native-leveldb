package com.reactnativeleveldb;

import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.ReactApplicationContext;
import android.util.Log;


public class LeveldbModule extends ReactContextBaseJavaModule {
  static {
    System.loadLibrary("reactnativeleveldb");
  }

  private static native void initialize(long jsiPtr, String docDir);
  private static native void destruct();

  private ReactApplicationContext reactApplicationContext;
  private JavaScriptContextHolder jsContext;

  public static void publicInitialize(ReactApplicationContext reactApplicationContext, JavaScriptContextHolder jsContext) {
    Log.i("Leveldb", "initializing leveldb");
    LeveldbModule.initialize(jsContext.get(), reactApplicationContext.getFilesDir().getAbsolutePath());
  }

  @Override
  public void onCatalystInstanceDestroy() {
    LeveldbModule.destruct();
  }
}
