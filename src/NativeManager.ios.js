import EventProvider from './EventProvider.js';

import {NativeModules, NativeEventEmitter} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

class NativeManager extends EventProvider {
  constructor() {
    super(['incomingCall', 'endCall', 'activateAudio', 'setMutedCall']);
    this.VoIPNotificationEmitter = new NativeEventEmitter(
      NativeModules.VoIPNotificationManager,
    );
  }

  configure() {
    this.VoIPNotificationEmitter.addListener('update', info => {
      firestore()
        .collection('users')
        .doc(auth().currentUser.uid)
        .update({
          APNSPushToken: info.token,
          APNSDev: info.dev,
        });
    });
    this.VoIPNotificationEmitter.addListener('invalidate', () => {
      firestore()
        .collection('users')
        .doc(auth().currentUser.uid)
        .update({
          APNSPushToken: '',
        });
    });
    this.VoIPNotificationEmitter.addListener('push', info => {
      this.fire('incomingCall', info);
    });
    this.VoIPNotificationEmitter.addListener('endCall', () => {
      this.fire('endCall', {});
    });
    this.VoIPNotificationEmitter.addListener('activateAudio', () => {
      this.fire('activateAudio', {});
    });
    this.VoIPNotificationEmitter.addListener('setMutedCall', () => {
      this.fire('setMutedCall', {});
    });
    NativeModules.VoIPNotificationManager.configure();
  }

  newOutgoingCall() {
    console.log('outgoing call');
    NativeModules.VoIPNotificationManager.newOutgoingCall();
  }

  callEnded() {
    console.log('ended call');
    NativeModules.VoIPNotificationManager.callEnded();
  }
}

const nativeManager = new NativeManager();

export default nativeManager;
