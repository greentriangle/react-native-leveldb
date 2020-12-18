require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-leveldb"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "10.0" }
  s.source       = { :git => "https://github.com/savv/react-native-leveldb.git", :tag => "#{s.version}" }

  s.pod_target_xcconfig = {
    :GCC_PREPROCESSOR_DEFINITIONS => "LEVELDB_IS_BIG_ENDIAN=0 LEVELDB_PLATFORM_POSIX HAVE_FULLFSYNC=1",
    :HEADER_SEARCH_PATHS => "\"${PROJECT_DIR}/Headers/Public/react-native-leveldb/leveldb/include/\" \"${PROJECT_DIR}/Headers/Public/react-native-leveldb/leveldb/\"",
    :WARNING_CFLAGS => "-Wno-shorten-64-to-32 -Wno-comma -Wno-unreachable-code -Wno-conditional-uninitialized -Wno-deprecated-declarations",
    :USE_HEADERMAP => "No"
  }

  s.header_mappings_dir = "cpp"
  s.source_files = "ios/**/*.{h,m,mm}", "cpp/*.{h,cpp}", "cpp/leveldb/db/*.{cc,h}", "cpp/leveldb/port/*.{cc,h}", "cpp/leveldb/table/*.{cc,h}", "cpp/leveldb/util/*.{cc,h}", "cpp/leveldb/include/leveldb/*.h"
  s.exclude_files =  "cpp/leveldb/**/*_test.cc", "cpp/leveldb/**/*_bench.cc", "cpp/leveldb/db/leveldbutil.cc", "cpp/leveldb/util/env_windows.cc", "cpp/leveldb/util/testutil.cc"

  s.dependency "React-Core"
end
