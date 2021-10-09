package com.reactnativeleveldb;

import com.facebook.react.bridge.JSIModulePackage;
import com.facebook.react.bridge.JSIModuleSpec;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.JavaScriptContextHolder;
import java.util.Collections;
import java.util.List;

public class LeveldbJsiPackage implements JSIModulePackage {
  private LeveldbModule leveldbModule;

  @Override
  public List<JSIModuleSpec> getJSIModules(
    final ReactApplicationContext reactApplicationContext,
    final JavaScriptContextHolder jsContext) {
      LeveldbModule.publicInitialize(reactApplicationContext, jsContext);
      return Collections.emptyList();
  };
}
