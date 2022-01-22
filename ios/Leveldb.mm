#import "Leveldb.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>
#import "react-native-leveldb.h"

using namespace facebook;

@implementation Leveldb
@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE(Leveldb)

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install)
{
  NSLog(@"Installing Leveldb bindings...");
  RCTBridge *bridge = [RCTBridge currentBridge];
  RCTCxxBridge *cxxBridge = (RCTCxxBridge *) bridge;
  if (cxxBridge == nil) {
    return @false;
  }
  if (cxxBridge.runtime == nil) {
    return @false;
  }
  NSURL *docPath = [[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask][0];
  installLeveldb(*(jsi::Runtime *)cxxBridge.runtime, std::string([[docPath path] UTF8String]));
  return @true;
}

- (void)invalidate {
  cleanupLeveldb();
}


@end
