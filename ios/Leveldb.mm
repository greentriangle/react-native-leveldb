#import "Leveldb.h"
#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>
#import "react-native-leveldb.h"

@implementation Leveldb
@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  _setBridgeOnMainQueue = RCTIsMainQueue();

  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)self.bridge;
  if (!cxxBridge.runtime) {
    return;
  }

  NSURL *docPath = [[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask][0];
    installLeveldb(*(facebook::jsi::Runtime *)cxxBridge.runtime, std::string([[docPath path] UTF8String]));
}

- (void)invalidate {
  cleanupLeveldb();
}


@end
