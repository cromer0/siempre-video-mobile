//
//  RNTOGVPlayerManager.m
//  SiempreVideoMobile
//

#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
#import <React/RCTLog.h>

#import <OGVKit/OGVKit.h>

@interface RNTOGVPlayerView : OGVPlayerView
@property (nonatomic, copy) RCTBubblingEventBlock onEnded;
@end

@implementation RNTOGVPlayerView
@end

@interface RNTOGVPlayerManager : RCTViewManager <OGVPlayerDelegate>
@end

@implementation RNTOGVPlayerManager
{
  RNTOGVPlayerView *player;
}

RCT_EXPORT_MODULE(RNTOGVPlayer)

RCT_EXPORT_VIEW_PROPERTY(onEnded, RCTBubblingEventBlock)
RCT_CUSTOM_VIEW_PROPERTY(sourceURL, NSString, OGVPlayerView)
{
  if (json) {
    NSURL *url = [NSURL fileURLWithPath:[RCTConvert NSString:json]];
    NSLog(@"%@", url);
    view.sourceURL = url;
    view.controlBar.alpha = 0.0f; // hide controls
    [view play];
  }
}

RCT_EXPORT_METHOD(pause:(nonnull NSNumber*) reactTag) {
    [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *,UIView *> *viewRegistry) {
        RNTOGVPlayerView *view = viewRegistry[reactTag];
        if (!view || ![view isKindOfClass:[RNTOGVPlayerView class]]) {
            RCTLogError(@"Cannot find NativeView with tag #%@", reactTag);
            return;
        }
        [view pause];
    }];
}

- (UIView *)view
{
  RNTOGVPlayerView* ogvp = [[RNTOGVPlayerView alloc] init];
  [ogvp layoutIfNeeded];
  ogvp.delegate = self;
  player = ogvp;
  return ogvp;
}

- (void)ogvPlayerDidEnd:(RNTOGVPlayerView *)sender
{
  if (!sender.onEnded) {
    return;
  }
  sender.onEnded(@{});
}

- (void)hideControlsImmediately:(NSTimer *)timer
{
  player.controlBar.alpha = 0.0f;
}

- (void)ogvPlayerControlsWillShow:(RNTOGVPlayerView *)sender
{
  // try to always hide controls
  [NSTimer
   scheduledTimerWithTimeInterval:0.0f
   target:self
   selector:@selector(hideControlsImmediately:)
   userInfo:nil
   repeats:NO
  ];
}

@end
