cmake_minimum_required(VERSION 3.9.0)

# Needed to locate double-conversion src correctly for folly includes
execute_process (COMMAND ln "-s" "src" "../../react-native/third-party/double-conversion-1.1.6/double-conversion")

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 14)
set (BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

add_subdirectory(../cpp/leveldb
        ./leveldb
        EXCLUDE_FROM_ALL)

add_library(cpp  # Library name
        SHARED  # Sets the library as a shared library.
        leveldb
        ../cpp/react-native-leveldb.cpp
        ../cpp/react-native-leveldb.h
        cpp-adapter.cpp
)

file (GLOB LIBFBJNI_INCLUDE_DIR "${BUILD_DIR}/fbjni-*-headers.jar/")

target_include_directories(
        cpp
        PRIVATE
        leveldb/include
        ${LIBFBJNI_INCLUDE_DIR}
        ../node_modules/react-native/React/Base
        ../node_modules/react-native/React
        ../node_modules/react-native/React/Base
        ../node_modules/react-native/ReactAndroid/src/main/jni
        ../node_modules/react-native/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni
        ../node_modules/react-native/ReactCommon
        ../node_modules/react-native/ReactCommon/callinvoker
        ../node_modules/react-native/ReactCommon/jsi
        ../node_modules/react-native/ReactCommon/jsi
        ../cpp
)

file (GLOB LIBRN_DIR "${BUILD_DIR}/react-native-0*/jni/${ANDROID_ABI}")
file (GLOB LIBJSC_DIR "${BUILD_DIR}/android-jsc*.aar/jni/${ANDROID_ABI}")

find_library(
        FBJNI_LIB
        fbjni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        JSEXECUTOR_LIB
        jscexecutor
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

find_library(
        FBJNI_LIBRARY fbjni
        PATHS ${libfbjni_link_DIRS}
        NO_CMAKE_FIND_ROOT_PATH
)

target_link_libraries(
        cpp
        leveldb
        ${JSEXECUTOR_LIB}
        ${FBJNI_LIB}
        android
        log)
