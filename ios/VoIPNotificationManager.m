//
//  VoIPNotificationManager.m
//  SiempreVideoMobile
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VoIPNotificationManager, NSObject)

RCT_EXTERN_METHOD(configure)
RCT_EXTERN_METHOD(callAccepted)
RCT_EXTERN_METHOD(callRejected)
RCT_EXTERN_METHOD(callEnded)
RCT_EXTERN_METHOD(newOutgoingCall)

@end
