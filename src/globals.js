import auth from '@react-native-firebase/auth';
import {
  mediaDevices,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';
const wrtc = {
  mediaDevices: mediaDevices,
  RTCPeerConnection: RTCPeerConnection,
  RTCIceCandidate: RTCIceCandidate,
  RTCSessionDescription: RTCSessionDescription,
};

import { StreamManager, SignalingServerConnection } from 'siemprevideo-streamlib';
import CallManager from './CallManager'; // TODO library
import nativeManager from './NativeManager';

let signaling = new SignalingServerConnection(auth());
let streamManager = new StreamManager(wrtc);
let callManager = new CallManager();

// for debugging
global.streamManager = streamManager;
global.signaling = signaling;

export {signaling, streamManager, callManager, nativeManager};
