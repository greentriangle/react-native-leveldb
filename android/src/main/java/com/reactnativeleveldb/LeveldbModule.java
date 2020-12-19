package com.reactnativeleveldb;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;


class LeveldbModule extends ReactContextBaseJavaModule {
  static {
    System.loadLibrary("cpp");
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

  @Override
  public void initialize() {
    super.initialize();

    LeveldbModule.initialize(
      this.getReactApplicationContext().getJavaScriptContextHolder().get(),
      this.getReactApplicationContext().getFilesDir().getAbsolutePath());
  }

  @Override
  public void onCatalystInstanceDestroy() {
    LeveldbModule.destruct();
  }
}
