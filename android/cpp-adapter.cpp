#include <jni.h>
#include "../cpp/react-native-leveldb.h"
#include <android/log.h>

extern "C"
JNIEXPORT void JNICALL
Java_com_reactnativeleveldb_LeveldbModule_initialize(JNIEnv* env, jclass clazz, jlong jsiPtr, jstring docDir) {
  const char *cstr = env->GetStringUTFChars(docDir, NULL);
  std::string str = std::string(cstr);
  env->ReleaseStringUTFChars(docDir, cstr);
  __android_log_print(ANDROID_LOG_VERBOSE, "react-native-leveldb", "Initializing react-native-leveldb with document dir %s", str.c_str());
  installLeveldb(*reinterpret_cast<facebook::jsi::Runtime*>(jsiPtr), std::string(str));
}

extern "C"
JNIEXPORT void JNICALL
Java_com_reactnativeleveldb_LeveldbModule_destruct(JNIEnv* env, jclass clazz) {
  cleanupLeveldb();
}