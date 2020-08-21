import EventProvider from './EventProvider.js';

class NativeManager extends EventProvider {
  constructor() {
    super(['incomingCall', 'endCall', 'activateAudio', 'setMutedCall']);
  }

  configure() {
    // TODO fire incoming call notifications when we get them
  }

  newOutgoingCall() {
    // TODO notify os that call has started, if necessary
  }

  callEnded() {
    // TODO notify os that call has ended, if necessary
  }
}

const nativeManager = new NativeManager();

export default nativeManager;
