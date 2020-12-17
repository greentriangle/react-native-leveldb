#import "react-native-leveldb.h"

//#include <jni.h>
//#include <android/log.h>
#include <iostream>
#include <sstream>
#import <leveldb/db.h>
#import <leveldb/write_batch.h>

using namespace facebook;


/**
 * To log a message:
namespace
{
    void log(const char *str)
    {
      __android_log_print(ANDROID_LOG_VERBOSE, "JSITest", "%s", str);
    }
}

      std::ostringstream message;
      message << "Putting KV " << key.ToString() << ":" << value.ToString();
      log(message.str().c_str());
 */

// TODO(savv): consider re-using unique_ptrs, if they are empty.
std::vector<std::unique_ptr<leveldb::DB>> dbs;
std::vector<std::unique_ptr<leveldb::Iterator>> iterators;

// Returns false if the passed value is not a string or an ArrayBuffer.
bool valueToSlice(jsi::Runtime& runtime, const jsi::Value& value, leveldb::Slice* slice) {
  if (value.isString()) {
    *slice = leveldb::Slice(value.asString(runtime).utf8(runtime));
    return true;
  }

  if (value.isObject()) {
    auto obj = value.asObject(runtime);
    if (!obj.isArrayBuffer(runtime)) {
      return false;
    }
    auto buf = obj.getArrayBuffer(runtime);
    *slice = leveldb::Slice((char*)buf.data(runtime), buf.size(runtime));
    return true;
  }

  return false;
}

leveldb::DB* valueToDb(const jsi::Value& value) {
  if (!value.isNumber()) {
    return nullptr;
  }
  int idx = (int)value.getNumber();
  if (idx < 0 || idx >= dbs.size() || !dbs[idx].get()) {
    return nullptr;
  }

  return dbs[idx].get();
}

leveldb::Iterator* valueToIterator(const jsi::Value& value) {
  if (!value.isNumber()) {
    return nullptr;
  }
  int idx = (int)value.getNumber();
  if (idx < 0 || idx >= dbs.size() || !dbs[idx].get()) {
    return nullptr;
  }

  return iterators[idx].get();
}

//extern "C" JNIEXPORT void JNICALL Java_com_reactnativeleveldb_LeveldbModule_initialize(JNIEnv* env, jclass clazz, jlong jsiPtr) {
//  installLeveldb(*reinterpret_cast<facebook::jsi::Runtime*>(jsiPtr));
//}

std::string documentDir;

void installLeveldb(jsi::Runtime& jsiRuntime, std::string _documentDir) {
  documentDir = _documentDir;

  std::cout << "Initializing react-native-leveldb with document dir " << documentDir;

  auto leveldbOpen = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbOpen"),
      3,  // db path, create_if_missing, error_if_exists
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        if (!arguments[0].isString() || !arguments[1].isBool() || !arguments[2].isBool()) {
          return jsi::Value(-1);
        }

        leveldb::Options options;
        std::string path = documentDir + arguments[0].getString(runtime).utf8(runtime);
        options.create_if_missing = arguments[1].getBool();
        options.error_if_exists = arguments[2].getBool();
        leveldb::DB* db;
        leveldb::Status status = leveldb::DB::Open(options, path, &db);
        dbs.push_back(std::unique_ptr<leveldb::DB>{db});
        int idx = (int)dbs.size() - 1;

        if (!status.ok()) {
          dbs[idx].release();
          return jsi::Value(-2);
        }

        return jsi::Value(idx);
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbOpen", std::move(leveldbOpen));

  auto leveldbClose = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbClose"),
      1,  // dbs index
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        if (!arguments[0].isNumber()) {
          return jsi::Value(-1);
        }
        int idx = (int)arguments[0].getNumber();
        if (idx < 0 || idx >= dbs.size() || !dbs[idx].get()) {
          return jsi::Value(-3);
        }

        dbs[idx].release();
        return nullptr;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbClose", std::move(leveldbClose));

  auto leveldbPut = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbPut"),
      3,  // dbs index, key, value
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Slice key, value;
        leveldb::DB* db = valueToDb(arguments[0]);
        if (!db || !valueToSlice(runtime, arguments[1], &key) || !valueToSlice(runtime, arguments[2], &value)) {
          return jsi::Value(-1);
        }

        auto status = db->Put(leveldb::WriteOptions(), key, value);

        if (!status.ok()) {
          return jsi::Value(-2);
        }

        return jsi::Value(0);
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbPut", std::move(leveldbPut));

  auto leveldbNewIterator = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbNewIterator"),
      1,  // index into dbs vector
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::DB* db = valueToDb(arguments[0]);
        if (!db) {
          return jsi::Value(-1);
        }
        iterators.push_back(std::unique_ptr<leveldb::Iterator>{db->NewIterator(leveldb::ReadOptions())});
        return jsi::Value((int)iterators.size() - 1);
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbNewIterator", std::move(leveldbNewIterator));

  auto leveldbIteratorSeekToFirst = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbIteratorSeekToFirst"),
      1,  // iterators index
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Iterator* iterator = valueToIterator(arguments[0]);
        if (!iterator) {
          return jsi::Value(-1);
        }
        iterator->SeekToFirst();
        return nullptr;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbIteratorSeekToFirst", std::move(leveldbIteratorSeekToFirst));

  auto leveldbIteratorSeekToLast = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbIteratorSeekToLast"),
      1,  // iterators index
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Iterator* iterator = valueToIterator(arguments[0]);
        if (!iterator) {
          return jsi::Value(-1);
        }
        iterator->SeekToLast();
        return nullptr;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbIteratorSeekToLast", std::move(leveldbIteratorSeekToLast));

  auto leveldbIteratorSeek = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbIteratorSeek"),
      2,  // iterators index, seek target
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Iterator* iterator = valueToIterator(arguments[0]);
        if (!iterator) {
          return jsi::Value(-1);
        }

        leveldb::Slice slice;
        if (!valueToSlice(runtime, arguments[1], &slice)) {
          return jsi::Value(-1);
        }
        iterator->Seek(slice);
        return nullptr;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbIteratorSeek", std::move(leveldbIteratorSeek));

  auto leveldbIteratorValid = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbIteratorValid"),
      1,  // iterators index
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Iterator* iterator = valueToIterator(arguments[0]);
        if (!iterator) {
          return jsi::Value(-1);
        }
        return jsi::Value(iterator->Valid());
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbIteratorValid", std::move(leveldbIteratorValid));

  auto leveldbIteratorNext = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbIteratorNext"),
      1,  // iterators index
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Iterator* iterator = valueToIterator(arguments[0]);
        if (!iterator) {
          return jsi::Value(-1);
        }
        iterator->Next();
        return nullptr;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbIteratorNext", std::move(leveldbIteratorNext));

  auto leveldbIteratorKeyStr = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbIteratorKeyStr"),
      1,  // iterators index
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Iterator* iterator = valueToIterator(arguments[0]);
        if (!iterator) {
          return jsi::Value(-1);
        }
        return jsi::Value(jsi::String::createFromUtf8(runtime, iterator->key().ToString()));;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbIteratorKeyStr", std::move(leveldbIteratorKeyStr));

  auto leveldbIteratorValueStr = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbIteratorValueStr"),
      1,  // iterators index
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Iterator* iterator = valueToIterator(arguments[0]);
        if (!iterator) {
          return jsi::Value(-1);
        }
        return jsi::Value(jsi::String::createFromUtf8(runtime, iterator->value().ToString()));;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbIteratorValueStr", std::move(leveldbIteratorValueStr));

  auto leveldbGetStr = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbGetStr"),
      2,  // dbs index, key
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Slice key;
        leveldb::DB* db = valueToDb(arguments[0]);

        std::string value;
        auto status = db->Get(leveldb::ReadOptions(), key, &value);
        if (!status.ok()) {
          return jsi::Value(-2);
        }
        return jsi::Value(jsi::String::createFromUtf8(runtime, value));;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbGetStr", std::move(leveldbGetStr));

#ifdef WITH_BUF
  auto leveldbIteratorKeyBuf = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbIteratorKeyBuf"),
      1,  // iterators index
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Iterator* iterator = valueToIterator(arguments[0]);
        if (!iterator) {
          return jsi::Value(-1);
        }
        std::string buf = iterator->key().ToString();
        return jsi::Value(jsi::ArrayBuffer::createFromBytes(runtime, buf.c_str(), buf.size()));;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbIteratorKeyBuf", std::move(leveldbIteratorKeyBuf));

  auto leveldbIteratorValueBuf = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbIteratorValueBuf"),
      1,  // iterators index
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Iterator* iterator = valueToIterator(arguments[0]);
        if (!iterator) {
          return jsi::Value(-1);
        }
        std::string buf = iterator->value().ToString();
        return jsi::Value(jsi::ArrayBuffer::createFromBytes(runtime, buf.c_str(), buf.size()));;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbIteratorValueBuf", std::move(leveldbIteratorValueBuf));

  auto leveldbGetBuf = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbGetBuf"),
      2,  // dbs index, key
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Slice key;
        leveldb::DB* db = valueToDb(arguments[0]);

        std::string value;
        auto status = db->Get(leveldb::ReadOptions(), key, &value);
        if (!status.ok()) {
          return jsi::Value(-2);
        }
        return jsi::Value(jsi::ArrayBuffer::createFromBytes(runtime, value.c_str(), value.size()));;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbGetBuf", std::move(leveldbGetBuf));
#endif
}