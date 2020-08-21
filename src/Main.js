import React from 'react';
import {
  View,
  PanResponder,
  StyleSheet,
  findNodeHandle,
  AppState,
} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';
import IdleTimerManager from 'react-native-idle-timer';
import InCallManager from 'react-native-incall-manager';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import Commons from './Commons';
import AllFriends from './AllFriends';
import Settings from './Settings';
import Private from './Private';
import TopBar from './TopBar';
import SelfCard from './SelfCard';
import { gestureIsClick, getSwipeDirection } from './utils';
import { signaling, streamManager, callManager, nativeManager } from './globals';

const pagesArray = ['settings', 'allfriends', 'commons', 'private'];

export default class Main extends React.Component {
  state = {
    whichPage: 2,
    selfVideoState: 0,
    topBarShow: false,
    myName: '',
    pluggedIn: {},
    friends: {},
    myStatus: null,
    myTextStatus: null,
    myPicPath: null,
    serverStatusTimeout: null,

    inCall: {},
    isPrivate: false,
    roomId: '',

    streamOut: null,
    streams: {},
    streamStates: {},
    mutedAudio: false,
    mutedVideo: false,

    isRecordingMessage: false,

    appState: AppState.currentState,
  };

  constructor(props) {
    super(props);
    this.listeningIds = {};
    this.snapshotListenersInitialized = false;
    this.streamManagerInitialized = false;
    this.roomUnsubscribe = () => { };
    this.userUnsubscribe = () => { };
    this.statusUnsubscribe = () => { };
    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (
          evt.nativeEvent.target ===
          findNodeHandle(this.refs.child.refs.container)
        ) {
          this.switchSelfVideoState(0);
        }
        let isTarget =
          this.state.whichPage === 0 ||
          this.state.whichPage === 3 ||
          evt.nativeEvent.target ===
          findNodeHandle(this.refs.child.refs.container);
        console.log('main onmove responder', isTarget);

        return (
          evt.nativeEvent.touches.length === 1 &&
          !gestureIsClick(gestureState) &&
          isTarget
        );
      },
      onPanResponderRelease: (evt, gestureState) => {
        let swipeDirection = getSwipeDirection(gestureState);
        console.log('main onpanrepsonderrelease ', swipeDirection, evt.target);
        if (swipeDirection === 'SWIPE_RIGHT') {
          this.switchPage(true);
        } else if (swipeDirection === 'SWIPE_LEFT') {
          this.switchPage(false);
        }
      },
    });
  }

  componentDidMount() {
    this.initSnapshotListeners();
    this.initStreamManager();
    this.initNativeListeners();
    IdleTimerManager.setIdleTimerDisabled(true);
    this.appStateListener = this.appStateChange.bind(this);
    AppState.addEventListener('change', this.appStateListener);
    callManager.initialize(this.props.id);

    this.updateStreamManagerAndListeners();
    this.showTopBar();
  }

  componentDidUpdate() {
    this.updateStreamManagerAndListeners();
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.appStateListener);
    IdleTimerManager.setIdleTimerDisabled(false);
    this.removeNativeListeners();
    this.destroyStreamManager();
    this.removeSnapshotListeners();
  }

  appStateChange(nextState) {
    if (nextState !== 'active' && this.state.appState === 'active') {
      /* TODO factor set status into utility class */
      AsyncStorage.getItem('statusTimeout').then(timeout => {
        if (
          (timeout !== null && new Date(parseInt(timeout)) < new Date()) ||
          timeout === null
        ) {
          firestore()
            .collection('users')
            .doc(this.props.id)
            .update({
              status: 2,
              statusTimeout: null,
            });
        }
      });
    }
    this.setState({ appState: nextState });
  }

  roomIdChange(roomId) {
    this.roomUnsubscribe();
    this.roomUnsubscribe = firestore()
      .collection('rooms')
      .doc(roomId)
      .onSnapshot(room => {
        if (!room || !room.exists) {
          return;
        } else {
          let newInCall = room.data()['users'];
          delete newInCall[this.props.id];
          if (this.state.isPrivate && !room.data()['isPrivate']) {
            this.setState({ whichPage: 2 });
          }
          this.setState({
            isPrivate: room.data()['isPrivate'],
            inCall: newInCall,
            roomId: roomId,
          });
        }
      });
  }

  initSnapshotListeners() {
    if (this.snapshotListenersInitialized) return;
    this.snapshotListenersInitialized = true;
    this.userUnsubscribe = firestore()
      .doc('users/' + this.props.id)
      .onSnapshot({ includeMetadataChanges: true }, doc => {
        if (doc === null || !doc.exists) return;
        let pluggedIn = doc.data()['pluggedIn'];
        let newStatus = doc.data()['status'];
        let newName = doc.data()['name'];
        let newTextStatus = doc.data()['textStatus'];
        let roomId = doc.data()['roomId'];
        let profPicPath = doc.data()['profilePicturePath'];
        let serverStatusTimeout = doc.data()['statusTimeout'];

        this.setState({
          myStatus: newStatus,
          myName: newName,
          myTextStatus: newTextStatus,
          pluggedIn: pluggedIn,
          serverStatusTimeout: serverStatusTimeout,
          myPicPath: profPicPath,
        });

        if (!doc.metadata.fromCache) {
          if (this.state.roomId === '' && roomId !== '') {
            console.log('enter room', roomId);
            this.roomIdChange(roomId);
            InCallManager.start({ media: 'video' });
          } else if (this.state.roomId !== '' && roomId === '') {
            console.log('exit room', this.state.roomId);
            this.roomUnsubscribe();
            this.setState({
              isPrivate: false,
              inCall: {},
              roomId: '',
            });
            nativeManager.callEnded();
          }
        }
      });
    this.statusUnsubscribe = firestore()
      .doc('statuses/' + this.props.id)
      .onSnapshot(doc => {
        if (doc === null || !doc.exists) return;
        this.setState({ friends: doc.data() });
      });
  }

  removeSnapshotListeners() {
    if (!this.snapshotListenersInitialized) return;
    this.snapshotListenersInitialized = false;
    this.roomUnsubscribe();
    this.userUnsubscribe();
    this.statusUnsubscribe();
  }

  initStreamManager() {
    if (this.streamManagerInitialized) return;
    this.streamManagerInitialized = true;
    /* TODO this function gets called more than initially intended.
     * Factor some stuff into the constructor and make streamManager.initialize
     * really minimal */
    function genUUID() {
      return (
        Math.random()
          .toString(36)
          .substring(2, 15) +
        Math.random()
          .toString(36)
          .substring(2, 15)
      );
    }
    let initializeWithUUID = uuid => {
      this.uuid = 'mobile:' + uuid;
      // TODO this races with the initialize calls in updateStreamManager
      signaling.initialize(uuid);
      signaling.onSignal = (id, data) => {
        streamManager.signal(id, data);
      };
      streamManager.onSignal = (id, data) => {
        signaling.signal(id, data);
      };
      streamManager.onStreamOut = stream => {
        this.setState({ streamOut: stream });
      };
      streamManager.onStreamIn = info => {
        this.setState(state => {
          state.streams[info.id] = info.stream;
          return state;
        });
      };
      streamManager.onMuteAudio = muted => {
        this.setState({ mutedAudio: muted });
      };
      streamManager.onMuteVideo = muted => {
        this.setState({ mutedVideo: muted });
      };
      streamManager.initialize(this.props.id, {
        audio: true,
        video: true,
      });
      streamManager.muteVideoAll(false);
      signaling.assertControl();
    };
    AsyncStorage.getItem('uuid')
      .then(uuid => {
        if (uuid === null) {
          uuid = genUUID();
          AsyncStorage.setItem('uuid', uuid)
            .then(initializeWithUUID.bind(uuid))
            .catch(_ => { });
        } else {
          initializeWithUUID(uuid);
        }
      })
      .catch(_ => { });
  }

  destroyStreamManager() {
    if (!this.streamManagerInitialized) return;
    this.streamManagerInitialized = false;
    this.listeningIds = {};
    streamManager.destroy();
    signaling.destroy();
  }

  initNativeListeners() {
    this.callListener = nativeManager.on('incomingCall', info => {
      console.log('incoming', info);
      this.setState({
        roomId: info.room,
        inCall: JSON.parse(info.inCall),
      });
      InCallManager.start({ media: 'video' });
      this.roomIdChange(info.room);
    });
    this.endCallListener = nativeManager.on('endCall', info => {
      console.log('nativeManager endCall');
      callManager.exit();
    });
    this.audioActivateListener = nativeManager.on('activateAudio', () => {
      console.log('activate');
    });
    this.setMutedCallListener = nativeManager.on('setMutedCall', muted => {
      console.log('muted');
      streamManager.muteAudioAll(muted);
    });
    nativeManager.configure();
  }

  removeNativeListeners() {
    nativeManager.remove('incomingCall', this.callListener);
    nativeManager.remove('endCall', this.endCallListener);
    nativeManager.remove('activateAudio', this.audioActivateListener);
    nativeManager.remove('setMutedCall', this.setMutedCallListener);
  }

  updateStreamManagerAndListeners() {
    AsyncStorage.getItem('statusTimeout')
      .then(timeout => {
        let myStatus = 2;
        if (timeout !== null) {
          if (new Date(parseInt(timeout)) > new Date()) {
            myStatus = this.state.myStatus;
          }
        }
        if (this.state.appState === 'active') {
          myStatus = this.state.myStatus;
        }

        const shouldStream = id => {
          return (
            [0, 1].includes(myStatus) &&
            this.state.pluggedIn[id] &&
            this.state.friends[id].active &&
            [0, 1].includes(this.state.friends[id].status) &&
            !this.state.isRecordingMessage
          );
        };

        // WARNING! because we don't have mediastream clone in
        // react-native-webrtc, everyone you call addVideo on has to have the
        // same values of setMuteVideo and setMuteAudio
        if (Object.keys(this.state.inCall).length > 0) {
          this.initSnapshotListeners();
          this.initStreamManager();
          signaling.assertControl(); // TODO
          Object.keys(this.state.friends).forEach(id => {
            if (this.state.inCall[id]) {
              streamManager.add(id);
              streamManager.muteAudio(id, false);
              if (this.state.appState !== 'active') {
                streamManager.muteVideo(id, true);
              } else {
                streamManager.muteVideo(id, false);
              }
            } else {
              streamManager.remove(id);
            }
          });
        } else if (this.state.appState !== 'active') {
          this.removeSnapshotListeners();
          this.destroyStreamManager();
        } else {
          this.initSnapshotListeners();
          this.initStreamManager();
          signaling.assertControl(); // TODO
          Object.keys(this.state.friends).forEach(id => {
            if (shouldStream(id)) {
              streamManager.add(id);
              streamManager.muteAudio(id, true);
              streamManager.muteVideo(id, false);
            } else {
              streamManager.remove(id);
            }
          });
        }
        Object.keys(this.state.friends).forEach((id) => {
          if (this.listeningIds[id]) return;
          this.listeningIds[id] = true;
          streamManager.onStreamUpdate(id, info => {
            this.setState(state => {
              state.streamStates[id] = info.state;
              return state;
            });
          });
        });
      })
      .catch(err => {
        console.log('error getting status timeout', err);
      });
  }

  switchPage(isLeft) {
    if (isLeft) {
      let newIndex = Math.max(0, this.state.whichPage - 1);
      this.setState({ whichPage: newIndex });
    } else {
      let newIndex = Math.min(pagesArray.length - 1, this.state.whichPage + 1);
      this.setState({ whichPage: newIndex });
    }
    this.showTopBar();
  }

  showTopBar() {
    this.setState({ topBarShow: true });
    setTimeout(() => {
      this.setState({ topBarShow: false });
    }, 1000);
  }

  switchSelfVideoState(state) {
    this.setState({ selfVideoState: state });
  }

  updateRecordingMessage(isRecording) {
    this.setState({ isRecordingMessage: isRecording });
  }

  render() {
    let mainComponent = null;
    if (pagesArray[this.state.whichPage] === 'settings') {
      mainComponent = (
        <Settings
          id={this.props.id}
          name={this.state.myName}
          myPicPath={this.state.myPicPath}
          switchPage={this.switchPage.bind(this)}
          updateUser={this.props.updateUser}
          updateRecordingMessage={this.updateRecordingMessage.bind(this)}
          ref="child"
        />
      );
    } else if (pagesArray[this.state.whichPage] === 'allfriends') {
      mainComponent = (
        <AllFriends
          id={this.props.id}
          switchPage={this.switchPage.bind(this)}
          friends={this.state.friends}
          pluggedIn={this.state.pluggedIn}
          inCall={this.state.inCall}
          ref="child"
        />
      );
    } else if (pagesArray[this.state.whichPage] === 'commons') {
      mainComponent = (
        <Commons
          id={this.props.id}
          switchPage={this.switchPage.bind(this)}
          friends={this.state.friends}
          pluggedIn={this.state.pluggedIn}
          inCall={this.state.inCall}
          streams={this.state.streams}
          streamStates={this.state.streamStates}
          myStatus={this.state.myStatus}
          switchSelfVideoState={this.switchSelfVideoState.bind(this)}
          updateRecordingMessage={this.updateRecordingMessage.bind(this)}
          ref="child"
        />
      );
    } else if (pagesArray[this.state.whichPage] === 'private') {
      mainComponent = (
        <Private
          inCall={this.state.inCall}
          isPrivate={this.state.isPrivate}
          streams={this.state.streams}
          ref="child"
        />
      );
    }

    return (
      <View style={styles.mainContainer} {...this._panResponder.panHandlers}>
        {mainComponent}
        {this.state.topBarShow ? (
          <TopBar currentPage={this.state.whichPage} />
        ) : null}
        {pagesArray[this.state.whichPage] !== 'settings' ?
          <SelfCard
            id={this.props.id}
            status={this.state.myStatus}
            textStatus={this.state.myTextStatus}
            name={this.state.myName}
            picturePath={this.state.myPicPath}
            videoOn={this.state.streamOut !== null}
            stream={this.state.streamOut}
            serverStatusTimeout={this.state.serverStatusTimeout}
            windowState={this.state.selfVideoState}
            switchState={this.switchSelfVideoState.bind(this)}
            videoWidth={150}
            videoHeight={200}
            mutedAudio={this.state.mutedAudio}
            mutedVideo={this.state.mutedVideo}
          />
          : null
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#F3D1B0',
  },
});
