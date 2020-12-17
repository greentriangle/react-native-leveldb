#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import "react-native-leveldb.h"

@interface Leveldb : NSObject <RCTBridgeModule>

@property (nonatomic, assign) BOOL setBridgeOnMainQueue;

@end
