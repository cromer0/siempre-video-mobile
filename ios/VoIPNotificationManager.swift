//
//  VoIPNotificationManager.swift
//  SiempreVideoMobile
//

import Foundation
import PushKit
import CallKit
import Speech

@objc(VoIPNotificationManager)
class VoIPNotificationManager : RCTEventEmitter, PKPushRegistryDelegate, CXProviderDelegate {
  static let shared = VoIPNotificationManager()
  
  let pushRegistry = PKPushRegistry.init(queue: DispatchQueue.main)
  var ckProvider : CXProvider!
  let ckCallController = CXCallController()
  
  var uuid : UUID? = nil

  override private init() {
    super.init()
    let ckProviderConfig = CXProviderConfiguration(localizedName: "SiempreVideo")
    if #available(iOS 11.0, *) {
      ckProviderConfig.includesCallsInRecents = false
    }
    ckProviderConfig.maximumCallGroups = 1
    ckProviderConfig.maximumCallsPerCallGroup = 1
    ckProviderConfig.ringtoneSound = "5-minutes-of-silence.mp3"
    ckProviderConfig.supportsVideo = true
    ckProviderConfig.supportedHandleTypes = [.generic]
    ckProvider = CXProvider(configuration: ckProviderConfig)
  }
  
  @objc
  override class func requiresMainQueueSetup() -> Bool {
    return false;
  }

  @objc
  override func supportedEvents() -> [String]! {
    return [
      "update", "invalidate", "push",
      "activateAudio", "endCall", "setMutedCall"
    ];
  }

  @objc
  func configure() {
    pushRegistry.delegate = self
    pushRegistry.desiredPushTypes = [PKPushType.voIP]
    ckProvider.setDelegate(self, queue: DispatchQueue.main)
  }
  // MARK: pushRegistry
  
  func pushRegistry(_ registry: PKPushRegistry, didUpdate credentials: PKPushCredentials, for type: PKPushType) {
    guard type == .voIP else {
      return
    }
    let newDeviceToken = (credentials.token as NSData)
    let normalToken = newDeviceToken.compactMap({c in String(format: "%02x", c)}).joined()
    #if DEBUG
    let isDev = true
    #else
    let isDev = false
    #endif
    self.sendEvent(withName: "update", body: ["dev": isDev, "token": normalToken])
  }
  func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
    guard type == .voIP else {
      return
    }
    self.sendEvent(withName: "invalidate", body: [:])
  }
  
  func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType) {
    self.pushRegistry(registry, didReceiveIncomingPushWith: payload, for: type) {}
  }
  func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
    self.uuid = UUID()
    let update = self.getDefaultUpdate()
    self.ckProvider.reportNewIncomingCall(with: self.uuid!, update: update) {(err) in
      guard err == nil else {
        NSLog("error reporting incoming call: \(err!)")
        return
      }
      let action = CXAnswerCallAction(call: self.uuid!)
      NSLog("accepting call")
      self.ckCallController.request(CXTransaction(action: action), completion: { err in
        NSLog("accepted call")
        if let err = err {
          NSLog("failed to request call answer: \(err.localizedDescription)")
        }
      })
    }
    self.sendEvent(withName: "push", body: payload.dictionaryPayload)
    completion()
  }
  
  @objc
  func callEnded() {
    if (self.uuid != nil) {
      self.ckProvider.reportCall(with: self.uuid!, endedAt: nil, reason: .remoteEnded)
    }
  }
  
  private func getDefaultUpdate() -> CXCallUpdate {
    let update = CXCallUpdate()
    update.supportsDTMF = false
    update.supportsGrouping = false
    update.supportsUngrouping = false
    update.supportsHolding = false
    update.hasVideo = false // TODO
    return update
  }
  
  // MARK: CXProviderDelegate
  
  func providerDidReset(_ provider: CXProvider) {
    NSLog("RESET!")
  }
  func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
    NSLog("ACTIVATE \(audioSession.category) \(audioSession.mode)")
  }
  func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
    NSLog("DEACTIVATE \(audioSession.category) \(audioSession.mode)")
  }
  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    action.fulfill()
  }
  func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
    action.fulfill()
  }
  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    self.sendEvent(withName: "endCall", body: [:])
    action.fulfill(withDateEnded: Date())
  }
  func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
    self.sendEvent(withName: "setMutedCall", body: action.isMuted)
    action.fulfill()
  }
}
