#import "react-native-leveldb.h"

#include <iostream>
#include <sstream>
#import <leveldb/db.h>
#import <leveldb/write_batch.h>

using namespace facebook;


// TODO(savv): consider re-using unique_ptrs, if they are empty.
std::vector<std::unique_ptr<leveldb::DB>> dbs;
std::vector<std::unique_ptr<leveldb::Iterator>> iterators;

// Returns false if the passed value is not a string or an ArrayBuffer.
bool valueToString(jsi::Runtime& runtime, const jsi::Value& value, std::string* str) {
  if (value.isString()) {
    *str = value.asString(runtime).utf8(runtime);
    return true;
  }

  if (value.isObject()) {
    auto obj = value.asObject(runtime);
    if (!obj.isArrayBuffer(runtime)) {
      return false;
    }
    auto buf = obj.getArrayBuffer(runtime);
    *str = std::string((char*)buf.data(runtime), buf.size(runtime));
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


void installLeveldb(jsi::Runtime& jsiRuntime, std::string documentDir) {
  if (documentDir[documentDir.length() - 1] != '/') {
    documentDir += '/';
  }
  std::cout << "Initializing react-native-leveldb with document dir \"" << documentDir << "\"" << "\n";

  auto leveldbOpen = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbOpen"),
      3,  // db path, create_if_missing, error_if_exists
      [documentDir](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
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
          dbs[idx].reset();
          return jsi::Value(-2);
        }

        return jsi::Value(idx);
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbOpen", std::move(leveldbOpen));

  auto leveldbDestroy = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbDestroy"),
      1,  // db path
      [documentDir](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        if (!arguments[0].isString()) {
          return jsi::Value(-1);
        }

        leveldb::Options options;
        std::string path = documentDir + arguments[0].getString(runtime).utf8(runtime);
        leveldb::Status status = leveldb::DestroyDB(path, options);
        return jsi::Value(status.ok() ? 0 : -2);
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbDestroy", std::move(leveldbDestroy));

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

        dbs[idx].reset();
        return nullptr;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbClose", std::move(leveldbClose));

  auto leveldbPut = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbPut"),
      3,  // dbs index, key, value
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        std::string key, value;
        leveldb::DB* db = valueToDb(arguments[0]);
        if (!db || !valueToString(runtime, arguments[1], &key) || !valueToString(runtime, arguments[2], &value)) {
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

  auto leveldbDelete = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbDelete"),
      2,  // dbs index, key
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        std::string key;
        leveldb::DB* db = valueToDb(arguments[0]);
        if (!db || !valueToString(runtime, arguments[1], &key)) {
          return jsi::Value(-1);
        }

        auto status = db->Delete(leveldb::WriteOptions(), key);

        if (!status.ok()) {
          return jsi::Value(-2);
        }

        return jsi::Value(0);
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbDelete", std::move(leveldbDelete));

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

        std::string target;
        if (!valueToString(runtime, arguments[1], &target)) {
          return jsi::Value(-1);
        }
        iterator->Seek(target);
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

  auto leveldbIteratorPrev = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbIteratorPrev"),
      1,  // iterators index
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Iterator* iterator = valueToIterator(arguments[0]);
        if (!iterator) {
          return jsi::Value(-1);
        }
        iterator->Prev();
        return nullptr;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbIteratorPrev", std::move(leveldbIteratorPrev));

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

  auto leveldbIteratorDelete = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbIteratorDelete"),
      1,  // iterators index
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Iterator* iterator = valueToIterator(arguments[0]);
        if (!iterator) {
          return jsi::Value(-1);
        }
        iterators[(int)arguments[0].getNumber()].reset();
        return nullptr;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbIteratorDelete", std::move(leveldbIteratorDelete));

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
        leveldb::DB* db = valueToDb(arguments[0]);
        std::string key;
        valueToString(runtime, arguments[1], &key);

        std::string value;
        auto status = db->Get(leveldb::ReadOptions(), key, &value);
        if (!status.ok()) {
          return jsi::Value(-2);
        }
        return jsi::Value(jsi::String::createFromUtf8(runtime, value));;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbGetStr", std::move(leveldbGetStr));

  auto leveldbIteratorKeyBuf = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbIteratorKeyBuf"),
      1,  // iterators index
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::Iterator* iterator = valueToIterator(arguments[0]);
        if (!iterator) {
          return jsi::Value(-1);
        }
        std::string key = iterator->key().ToString();

        jsi::Function arrayBufferCtor = runtime.global().getPropertyAsFunction(runtime, "ArrayBuffer");
        jsi::Object o = arrayBufferCtor.callAsConstructor(runtime, (int)key.length()).getObject(runtime);
        jsi::ArrayBuffer buf = o.getArrayBuffer(runtime);
        memcpy(buf.data(runtime), key.c_str(), key.size());
        return o;
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
        std::string value = iterator->value().ToString();

        jsi::Function arrayBufferCtor = runtime.global().getPropertyAsFunction(runtime, "ArrayBuffer");
        jsi::Object o = arrayBufferCtor.callAsConstructor(runtime, (int)value.length()).getObject(runtime);
        jsi::ArrayBuffer buf = o.getArrayBuffer(runtime);
        memcpy(buf.data(runtime), value.c_str(), value.size());
        return o;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbIteratorValueBuf", std::move(leveldbIteratorValueBuf));

  auto leveldbGetBuf = jsi::Function::createFromHostFunction(
      jsiRuntime,
      jsi::PropNameID::forAscii(jsiRuntime, "leveldbGetBuf"),
      2,  // dbs index, key
      [](jsi::Runtime& runtime, const jsi::Value& thisValue, const jsi::Value* arguments, size_t count) -> jsi::Value {
        leveldb::DB* db = valueToDb(arguments[0]);
        std::string key;
        valueToString(runtime, arguments[1], &key);

        std::string value;
        auto status = db->Get(leveldb::ReadOptions(), key, &value);
        if (!status.ok()) {
          return jsi::Value(-2);
        }

        jsi::Function arrayBufferCtor = runtime.global().getPropertyAsFunction(runtime, "ArrayBuffer");
        jsi::Object o = arrayBufferCtor.callAsConstructor(runtime, (int)value.length()).getObject(runtime);
        jsi::ArrayBuffer buf = o.getArrayBuffer(runtime);
        memcpy(buf.data(runtime), value.c_str(), value.size());
        return o;
      }
  );
  jsiRuntime.global().setProperty(jsiRuntime, "leveldbGetBuf", std::move(leveldbGetBuf));
}

void cleanupLeveldb() {
  iterators.clear();
  dbs.clear();
}
