cmake_minimum_required(VERSION 3.9.0)

# Needed to locate double-conversion src correctly for folly includes
execute_process (COMMAND ln "-s" "src" "../node_modules/react-native/third-party/double-conversion-1.1.6/double-conversion")

add_subdirectory(../cpp/leveldb
        ./leveldb
        EXCLUDE_FROM_ALL)

include_directories(
        ../cpp
        leveldb/include
        ../node_modules/react-native/React
        ../node_modules/react-native/React/Base
        ../node_modules/react-native/ReactCommon/jsi
        ../node_modules/react-native/third-party/folly-2018.10.22.00
        ../node_modules/react-native/third-party/double-conversion-1.1.6
        ../node_modules/react-native/third-party/boost_1_63_0
        ../node_modules/react-native/third-party/glog-0.3.5/src
)

add_definitions(
        -DFOLLY_USE_LIBCPP=1
        -DFOLLY_NO_CONFIG=1
        -DFOLLY_HAVE_MEMRCHR=1
)

add_library(cpp  # Library name
        SHARED  # Sets the library as a shared library.
        leveldb
        # Provides a relative path to your source file(s).
        ../node_modules/react-native/ReactCommon/jsi/jsi/jsi.cpp
        ../cpp/react-native-leveldb.cpp
        ../cpp/react-native-leveldb.h
        cpp-adapter.cpp
)

target_link_libraries(cpp
        leveldb
        android
        log)
