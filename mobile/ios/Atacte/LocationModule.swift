import Foundation
import CoreLocation
import React

@objc(LocationModule)
class LocationModule: NSObject, CLLocationManagerDelegate {
  
  private var locationManager: CLLocationManager?
  private var isTracking = false
  private var authToken: String?
  private var apiUrl: String?
  
  override init() {
    super.init()
    setupLocationManager()
    loadCredentials()
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  private func setupLocationManager() {
    locationManager = CLLocationManager()
    locationManager?.delegate = self
    locationManager?.desiredAccuracy = kCLLocationAccuracyBest
    locationManager?.distanceFilter = 10
    locationManager?.allowsBackgroundLocationUpdates = true
    locationManager?.pausesLocationUpdatesAutomatically = false
    locationManager?.showsBackgroundLocationIndicator = true
  }
  
  private func loadCredentials() {
    let sharedDefaults = UserDefaults(suiteName: "group.com.atacte.mobile")
    authToken = sharedDefaults?.string(forKey: "auth_token")
    apiUrl = sharedDefaults?.string(forKey: "api_url") ?? "http://localhost:3000"
  }
  
  @objc
  func startTracking(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else {
        reject("ERROR", "Self is nil", nil)
        return
      }
      
      let authStatus: CLAuthorizationStatus
      if #available(iOS 14.0, *) {
        authStatus = self.locationManager?.authorizationStatus ?? .notDetermined
      } else {
        authStatus = CLLocationManager.authorizationStatus()
      }
      
      if authStatus == .authorizedAlways || authStatus == .authorizedWhenInUse {
        self.isTracking = true
        self.locationManager?.startUpdatingLocation()
        self.saveTrackingState(true)
        resolve(true)
      } else {
        reject("PERMISSION_ERROR", "Permissão de localização não concedida", nil)
      }
    }
  }
  
  @objc
  func stopTracking(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else {
        reject("ERROR", "Self is nil", nil)
        return
      }
      
      self.isTracking = false
      self.locationManager?.stopUpdatingLocation()
      self.saveTrackingState(false)
      resolve(true)
    }
  }
  
  @objc
  func isTrackingActive(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(isTracking)
  }
  
  @objc
  func saveAuthToken(_ token: String, apiUrl: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    let sharedDefaults = UserDefaults(suiteName: "group.com.atacte.mobile")
    sharedDefaults?.set(token, forKey: "auth_token")
    sharedDefaults?.set(apiUrl, forKey: "api_url")
    sharedDefaults?.synchronize()
    
    self.authToken = token
    self.apiUrl = apiUrl
    
    resolver(true)
  }
  
  @objc
  func clearAuthToken(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    let sharedDefaults = UserDefaults(suiteName: "group.com.atacte.mobile")
    sharedDefaults?.removeObject(forKey: "auth_token")
    sharedDefaults?.removeObject(forKey: "api_url")
    sharedDefaults?.synchronize()
    
    self.authToken = nil
    self.apiUrl = nil
    
    resolver(true)
  }
  
  @objc
  func requestLocationPermissions(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { [weak self] in
      self?.locationManager?.requestAlwaysAuthorization()
      resolve(true)
    }
  }
  
  @objc
  func checkLocationPermissions(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let authStatus: CLAuthorizationStatus
    if #available(iOS 14.0, *) {
      authStatus = locationManager?.authorizationStatus ?? .notDetermined
    } else {
      authStatus = CLLocationManager.authorizationStatus()
    }
    
    let granted = authStatus == .authorizedAlways || authStatus == .authorizedWhenInUse
    resolve(granted)
  }
  
  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let location = locations.last, isTracking else { return }
    
    sendLocationToServer(location)
  }
  
  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    print("Erro de localização: \(error.localizedDescription)")
  }
  
  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    let authStatus: CLAuthorizationStatus
    if #available(iOS 14.0, *) {
      authStatus = manager.authorizationStatus
    } else {
      authStatus = CLLocationManager.authorizationStatus()
    }
    
    if authStatus == .authorizedAlways || authStatus == .authorizedWhenInUse {
      if isTracking {
        manager.startUpdatingLocation()
      }
    }
  }
  
  private func sendLocationToServer(_ location: CLLocation) {
    guard let token = authToken,
          let apiUrl = apiUrl,
          let url = URL(string: "\(apiUrl)/api/location") else {
      return
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let payload: [String: Any] = [
      "latitude": location.coordinate.latitude,
      "longitude": location.coordinate.longitude,
      "accuracy": location.horizontalAccuracy,
      "altitude": location.altitude,
      "speed": location.speed >= 0 ? location.speed : NSNull(),
      "heading": location.course >= 0 ? location.course : NSNull(),
      "isMoving": location.speed > 0.5,
      "triggerType": "MOVEMENT"
    ]
    
    do {
      request.httpBody = try JSONSerialization.data(withJSONObject: payload)
      
      let task = URLSession.shared.dataTask(with: request) { data, response, error in
        if let error = error {
          print("Erro ao enviar localização: \(error.localizedDescription)")
          return
        }
        
        if let httpResponse = response as? HTTPURLResponse,
           httpResponse.statusCode != 200 && httpResponse.statusCode != 201 {
          print("Erro ao enviar localização. Status: \(httpResponse.statusCode)")
        }
      }
      
      task.resume()
    } catch {
      print("Erro ao serializar payload: \(error.localizedDescription)")
    }
  }
  
  private func saveTrackingState(_ active: Bool) {
    let sharedDefaults = UserDefaults(suiteName: "group.com.atacte.mobile")
    sharedDefaults?.set(active, forKey: "tracking_active")
    sharedDefaults?.synchronize()
  }
  
  @objc
  func saveCalendarEvents(_ eventsJson: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    let sharedDefaults = UserDefaults(suiteName: "group.com.atacte.mobile")
    sharedDefaults?.set(eventsJson, forKey: "calendar_events")
    sharedDefaults?.synchronize()
    resolver(true)
  }
  
  @objc
  func sendInteractionLocation(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self,
            let locationManager = self.locationManager else {
        reject("ERROR", "LocationManager não disponível", nil)
        return
      }
      
      guard let lastLocation = locationManager.location else {
        reject("NO_LOCATION", "Localização não disponível", nil)
        return
      }
      
      guard let token = self.authToken,
            let apiUrl = self.apiUrl else {
        reject("NO_TOKEN", "Token não encontrado", nil)
        return
      }
      
      var payload: [String: Any] = [
        "latitude": lastLocation.coordinate.latitude,
        "longitude": lastLocation.coordinate.longitude,
        "accuracy": lastLocation.horizontalAccuracy,
        "altitude": lastLocation.altitude,
        "speed": lastLocation.speed >= 0 ? lastLocation.speed : NSNull(),
        "heading": lastLocation.course >= 0 ? lastLocation.course : NSNull(),
        "isMoving": false,
        "triggerType": "INTERACTION"
      ]
      
      guard let url = URL(string: "\(apiUrl)/api/location") else {
        reject("INVALID_URL", "URL inválida", nil)
        return
      }
      
      var request = URLRequest(url: url)
      request.httpMethod = "POST"
      request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      
      do {
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
          if let error = error {
            reject("NETWORK_ERROR", error.localizedDescription, error)
            return
          }
          
          if let httpResponse = response as? HTTPURLResponse,
             httpResponse.statusCode != 200 && httpResponse.statusCode != 201 {
            reject("HTTP_ERROR", "Status: \(httpResponse.statusCode)", nil)
            return
          }
          
          resolve(true)
        }
        
        task.resume()
      } catch {
        reject("SERIALIZATION_ERROR", error.localizedDescription, error)
      }
    }
  }
}
