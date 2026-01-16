#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CalendarWidgetModule, NSObject)

RCT_EXTERN_METHOD(saveAuthToken:(NSString *)token apiUrl:(NSString *)apiUrl resolver:(RCTPromiseResolveBlock)resolver rejecter:(RCTPromiseRejectBlock)rejecter)
RCT_EXTERN_METHOD(clearAuthToken:(RCTPromiseResolveBlock)resolver rejecter:(RCTPromiseRejectBlock)rejecter)

@end
