//
//  AudioManager.swift
//  SiempreOne
//

import Foundation
import AVKit

@objc(AudioManager)
class AudioManager : NSObject {
  static let shared = AudioManager()
  static let kPreferredOutputs : [AVAudioSession.Port] = [.bluetoothA2DP, .bluetoothHFP, .bluetoothLE, .carAudio, .headphones]
  
  override private init() {
    super.init()
    self.setVideoChat()
  }

  @objc
  class func requiresMainQueueSetup() -> Bool {
    return false;
  }
  
  @objc(setActive:)
  func setActive(_ active: Bool) {
    do {
      try AVAudioSession.sharedInstance().setActive(active, options: .notifyOthersOnDeactivation)
    } catch {
      NSLog("error setting active to \(active): \(error)")
    }
  }

  @objc
  func setVideoChat() {
    let options : AVAudioSession.CategoryOptions = [.defaultToSpeaker]
    do {
      try AVAudioSession.sharedInstance().setCategory(.playAndRecord, options: options)
      try AVAudioSession.sharedInstance().setMode(.videoChat)
    } catch {
      NSLog("error setting video chat: \(error)")
    }
  }
  
  func setVoiceChat() {
    let options : AVAudioSession.CategoryOptions = [/*.defaultToSpeaker, */.allowBluetooth, .allowBluetoothA2DP]
    try! AVAudioSession.sharedInstance().setCategory(.playAndRecord, options: options)
    try! AVAudioSession.sharedInstance().setMode(.voiceChat)
  }
  
  func setPlayAudioInBackground() {
    try! AVAudioSession.sharedInstance().setCategory(.playAndRecord)
    try! AVAudioSession.sharedInstance().setMode(.voiceChat)
  }
  
  func setRecordAudioInForeground() {
    try! AVAudioSession.sharedInstance().setCategory(.playAndRecord)
  }
  
  func setPlayAudioInForeground() {
    try! AVAudioSession.sharedInstance().setCategory(.playback)
    try! AVAudioSession.sharedInstance().setMode(.default)
  }
  
  func setRouting() {
    guard !AudioManager.kPreferredOutputs.contains(AVAudioSession.sharedInstance().currentRoute.inputs.first?.portType ?? AVAudioSession.Port.builtInMic) else {
      // we're already good
      return
    }
    // if none of our preferred inputs are available, force to speaker
    print("forcing output to speaker")
    do {
      try AVAudioSession.sharedInstance().overrideOutputAudioPort(.speaker)
    } catch {
      NSLog("error forcing to speaker: \(error)")
    }
  }
}
