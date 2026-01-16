import Foundation
import React

@objc(CalendarWidgetModule)
class CalendarWidgetModule: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func saveAuthToken(_ token: String, apiUrl: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    let sharedDefaults = UserDefaults(suiteName: "group.com.atacte.mobile")
    sharedDefaults?.set(token, forKey: "auth_token")
    sharedDefaults?.set(apiUrl, forKey: "api_url")
    sharedDefaults?.synchronize()
    resolver(true)
  }
  
  @objc
  func clearAuthToken(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    let sharedDefaults = UserDefaults(suiteName: "group.com.atacte.mobile")
    sharedDefaults?.removeObject(forKey: "auth_token")
    sharedDefaults?.removeObject(forKey: "api_url")
    sharedDefaults?.synchronize()
    resolver(true)
  }
}
