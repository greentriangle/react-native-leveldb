cmake_minimum_required(VERSION 3.9.0)

set (PACKAGE_NAME "react-native-leveldb")
set (BUILD_DIR ${CMAKE_SOURCE_DIR}/build)

set (LEVELDB_BUILD_TESTS OFF CACHE INTERNAL "Really don't build LevelDB tests") # FORCE implied by INTERNAL
set (LEVELDB_BUILD_BENCHMARKS OFF CACHE INTERNAL "Really don't build LevelDB benchmarks")
set (LEVELDB_INSTALL OFF CACHE INTERNAL "Really don't install LevelDB")

add_subdirectory(../cpp/leveldb leveldb)

include_directories(
        ../cpp/leveldb
        "${NODE_MODULES_DIR}/react-native/React"
        "${NODE_MODULES_DIR}/react-native/React/Base"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/jsi"
)

add_library(reactnativeleveldb  # Library name
        SHARED  # Sets the library as a shared library.
        ../cpp/react-native-leveldb.cpp
        cpp-adapter.cpp
)

set_target_properties(
        reactnativeleveldb PROPERTIES
        CXX_STANDARD 14
        CXX_EXTENSIONS OFF
        POSITION_INDEPENDENT_CODE ON
)

file (GLOB LIBRN_DIR "${BUILD_DIR}/react-native-0*/jni/${ANDROID_ABI}")

find_library(
        log-lib
        log
)
find_library(
        REACT_NATIVE_JNI_LIB
        reactnativejni
        PATHS ${LIBRN_DIR}
        NO_CMAKE_FIND_ROOT_PATH
)

target_link_libraries(
        reactnativeleveldb
        leveldb
        ${log-lib}
        ${REACT_NATIVE_JNI_LIB}
        android
)