cmake_minimum_required(VERSION 3.9.0)

# Needed to locate double-conversion src correctly for folly includes
execute_process (COMMAND ln "-s" "src" "../../react-native/third-party/double-conversion-1.1.6/double-conversion")

set (CMAKE_VERBOSE_MAKEFILE ON)
set (CMAKE_CXX_STANDARD 14)
set (BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

set (LEVELDB_BUILD_TESTS OFF CACHE INTERNAL "Really don't build LevelDB tests") # FORCE implied by INTERNAL
set (LEVELDB_BUILD_BENCHMARKS OFF CACHE INTERNAL "Really don't build LevelDB benchmarks")
set (LEVELDB_INSTALL OFF CACHE INTERNAL "Really don't install LevelDB")

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
        "${NODE_MODULES_DIR}/react-native/React/Base"
        "${NODE_MODULES_DIR}/react-native/React"
        "${NODE_MODULES_DIR}/react-native/React/Base"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/jni"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/java/com/facebook/react/turbomodule/core/jni"
        "${NODE_MODULES_DIR}/react-native/ReactCommon"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi"
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
