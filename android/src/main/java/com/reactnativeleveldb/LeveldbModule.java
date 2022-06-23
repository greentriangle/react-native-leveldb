package com.reactnativeleveldb;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import android.util.Log;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = LeveldbModule.NAME)
public class LeveldbModule extends ReactContextBaseJavaModule {
    public static final String NAME = "Leveldb";

    public LeveldbModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    static {
        try {
            Log.i(NAME, "Loading C++ library...");
            System.loadLibrary("reactnativeleveldb");
        } catch (Exception ignored) {
        }
    }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public boolean install() {
    try {
      JavaScriptContextHolder jsContext = getReactApplicationContext().getJavaScriptContextHolder();
      String directory = getReactApplicationContext().getFilesDir().getAbsolutePath();
      Log.i(NAME, "Initializing leveldb with directory " + directory);
      LeveldbModule.initialize(jsContext.get(), directory);
      Log.i(NAME, "Successfully installed!");
      return true;
    } catch (Exception exception) {
      Log.e(NAME, "Failed to install JSI Bindings!", exception);
      return false;
    }
  }

  private static native void initialize(long jsiPtr, String docDir);
  private static native void destruct();

  @Override
  public void onCatalystInstanceDestroy() {
    Log.i("Leveldb", "Closing all leveldb iterators and instances");
    LeveldbModule.destruct();
  }
}
