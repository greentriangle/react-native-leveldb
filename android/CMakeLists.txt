cmake_minimum_required(VERSION 3.9.0)

<<<<<<< HEAD
# Needed to locate double-conversion src correctly for folly includes
execute_process (COMMAND ln "-s" "src" "../../react-native/third-party/double-conversion-1.1.6/double-conversion")

=======
>>>>>>> 45dafbb (Remove folly from android lib)
add_subdirectory(../cpp/leveldb
        ./leveldb
        EXCLUDE_FROM_ALL)

include_directories(
        ../cpp
        leveldb/include
        ../../react-native/React
        ../../react-native/React/Base
        ../../react-native/ReactCommon/jsi
)

add_definitions(
)

add_library(cpp  # Library name
        SHARED  # Sets the library as a shared library.
        leveldb
        # Provides a relative path to your source file(s).
        ../../react-native/ReactCommon/jsi/jsi/jsi.cpp
        ../cpp/react-native-leveldb.cpp
        ../cpp/react-native-leveldb.h
        cpp-adapter.cpp
)

target_link_libraries(cpp
        leveldb
        android
        log)
