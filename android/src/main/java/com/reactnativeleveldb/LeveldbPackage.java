package com.reactnativeleveldb;

import androidx.annotation.NonNull;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JSIModulePackage;
import com.facebook.react.bridge.JSIModuleSpec;
import com.facebook.react.bridge.JSIModulePackage;
import com.facebook.react.bridge.JSIModuleType;
import com.facebook.react.bridge.JSIModuleType;
import com.facebook.react.bridge.JSIModuleType;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.JSIModulePackage;
import com.facebook.react.bridge.JSIModuleProvider;
import com.facebook.react.bridge.JSIModuleSpec;
import com.facebook.react.bridge.JSIModuleType;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import android.util.Log;

public class LeveldbPackage implements JSIModulePackage {
  private LeveldbModule leveldbModule;

  @Override
  public List<JSIModuleSpec> getJSIModules(
    final ReactApplicationContext reactApplicationContext,
    final JavaScriptContextHolder jsContext) {
      LeveldbModule.publicInitialize(reactApplicationContext, jsContext);
      return Collections.emptyList();
  };
}
