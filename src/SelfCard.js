import React from 'react';
import {
  View,
  Image,
  Text,
  TextInput,
  StyleSheet,
  PanResponder,
  findNodeHandle,
  TouchableOpacity,
} from 'react-native';
import {getSwipeDirection} from './utils';
import {streamManager} from './globals';

import AsyncStorage from '@react-native-community/async-storage';
import {RTCView} from 'react-native-webrtc';
import firestore from '@react-native-firebase/firestore';

import ProfilePicture from './ProfilePicture';

var backgroundColor = '#5f5f5f';
var foregroundColor = '#919191';

let darkRed = '#700000';
let normalRed = '#ff0000';
let fadedRed = '#ad5e5899';

let darkGreen = '#004f00';
let normalGreen = '#3ead3e';
let fadedGreen = '#61d06866';

let darkGray = '#575757';
let normalGray = '#919191';
let fadedGray = '#5f5f5f66';

let times = [5, 10, 20, 30, 60];
let HOLD_THRESHOLD = 100;

export default class SelfCard extends React.Component {
  constructor(props) {
    super(props);

    this.layoutOffset = {};
    this.textLayouts = {};
    this.swipingStatus = null;
    this.startTimestamp = null;
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        console.log('selfcard onstart');

        this.startTimestamp = evt.nativeEvent.timestamp;
        if (
          evt.nativeEvent.target === findNodeHandle(this.refs.availableText)
        ) {
          this.setState({swipedStatus: 0});
          this.swipingStatus = 0;
        } else if (
          evt.nativeEvent.target === findNodeHandle(this.refs.busyText)
        ) {
          this.setState({swipedStatus: 1});
          this.swipingStatus = 1;
        } else if (
          evt.nativeEvent.target === findNodeHandle(this.refs.offlineText)
        ) {
          this.setState({swipedStatus: 2});
          this.swipingStatus = 2;
        } else {
          this.setState({swipedStatus: null});
          this.swipingStatus = null;
        }
        this.setState({hoveredStatus: null});
        return true;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (
          this.props.windowState === 1 &&
          evt.nativeEvent.timestamp - this.startTimestamp >= HOLD_THRESHOLD &&
          this.swipingStatus !== null
        ) {
          this.props.switchState(2);
        } else if (this.props.windowState === 2) {
          let isHovered = false;
          for (let idx = 0; idx < Object.keys(this.textLayouts).length; idx++) {
            let {x, y, width, height} = this.textLayouts[idx];
            if (
              this.inLayout(
                evt.nativeEvent.pageX,
                evt.nativeEvent.pageY,
                x,
                y,
                width,
                height,
              )
            ) {
              this.setState({hoveredStatus: idx});
              isHovered = true;
            }
          }

          if (!isHovered) {
            this.setState({hoveredStatus: null});
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log('selfcard onpanrepsonderrelease');

        let swipeDirection = getSwipeDirection(gestureState);
        if (this.props.windowState === 0 && swipeDirection === 'SWIPE_UP') {
          this.props.switchState(1);
        } else if (this.props.windowState === 1) {
          if (this.swipingStatus !== null) {
            this.setStatus(this.swipingStatus);
            this.props.switchState(0);
          }
        } else if (this.props.windowState === 2) {
          console.log(times[this.state.hoveredStatus]);
          this.setTimedStatus(
            this.swipingStatus,
            times[this.state.hoveredStatus],
          );
          this.props.switchState(0);
        }
        this.swipingStatus = null;
        this.startTimestamp = null;
      },
    });

    this.state = {
      swipedStatus: null,
      hoveredStatus: null,
      textStatus: null,
      micEnabled: streamManager.globalAudioEnabled,
      videoEnabled: streamManager.globalVideoEnabled,
    };

    this.timeoutTimer = null;
  }

  componentDidMount() {
    this.getFirstTextUpdate();
    this.timeoutTimer = setInterval(() => {
      this.setState({
        timedStatus: SelfCard.getTimedStatus(this.props.serverStatusTimeout),
      });
    }, 60000);
  }

  componentDidUpdate() {
    this.getFirstTextUpdate();
  }

  componentWillUnmount() {
    clearInterval(this.timeoutTimer);
  }

  static getTimedStatus(serverStatusTimeout) {
    let timedStatus = 0;
    if (serverStatusTimeout && serverStatusTimeout.toDate) {
      console.log('status timeout', serverStatusTimeout.toDate());
      timedStatus = serverStatusTimeout.toDate() - new Date();
    }
    return timedStatus;
  }

  static getDerivedStateFromProps(props, state) {
    if (state.serverStatusTimeout !== props.serverStatusTimeout) {
      let timedStatus = SelfCard.getTimedStatus(props.serverStatusTimeout);
      return {
        serverStatusTimeout: props.serverStatusTimeout,
        timedStatus: timedStatus,
      };
    }
    return null;
  }

  getFirstTextUpdate() {
    if (this.props.textStatus && !this.hadUpdate) {
      this.setState({textStatus: this.props.textStatus});
      this.hadUpdate = true;
    }
  }

  inLayout(curX, curY, x, y, width, height) {
    x = x + this.layoutOffset.x;
    y = y + this.layoutOffset.y;
    return curX >= x && curX <= x + width && curY >= y && curY <= y + width;
  }

  setStatus(status) {
    this.props.switchState(0);
    AsyncStorage.setItem('statusTimeout', new Date().getTime().toString())
      .then(() => {
        firestore()
          .collection('users')
          .doc(this.props.id)
          .update({
            status: status,
            statusTimeout: null,
          });
      })
      .catch(err => {});
    // TODO clear notification
  }

  setTextStatus() {
    firestore()
      .collection('users')
      .doc(this.props.id)
      .update({textStatus: this.state.textStatus});
  }

  setTimedStatus(status, timeout) {
    this.props.switchState(0);

    let timeoutDate = new Date(new Date().getTime() + timeout * 1000 * 60);
    AsyncStorage.setItem('statusTimeout', timeoutDate.getTime().toString())
      .then(() => {
        firestore()
          .collection('users')
          .doc(this.props.id)
          .update({
            status: status,
            statusTimeout: timeoutDate,
          });
      })
      .catch(err => {});
    // TODO send notification
  }

  timerOption = function(index) {
    let newStatusColor;
    let selectedColor;
    if (this.state.swipedStatus === 2) {
      newStatusColor = normalGray;
      selectedColor = darkGray;
    } else if (this.state.swipedStatus === 1) {
      newStatusColor = normalRed;
      selectedColor = darkRed;
    } else if (this.state.swipedStatus === 0) {
      newStatusColor = normalGreen;
      selectedColor = darkGreen;
    }

    return (
      <Text
        style={{
          paddingTop: 8,
          paddingBottom: 12,
          textAlign: 'center',
          backgroundColor:
            this.state.hoveredStatus === index ? selectedColor : newStatusColor,
        }}
        onLayout={event => {
          const layout = event.nativeEvent.layout;
          this.textLayouts[index] = {
            height: layout.height,
            width: layout.width,
            x: layout.x,
            y: layout.y,
          };
        }}>
        {times[index]}
      </Text>
    );
  };

  toggleAudio() {
    streamManager.muteAudioAll(!this.props.mutedAudio);
  }

  toggleVideo() {
    streamManager.muteVideoAll(!this.props.mutedVideo);
  }

  statusCardOption = function(option) {
    let refText;
    let optionText;
    let statusColor;
    let color;

    if (option == 0) {
      refText = 'availableText';
      optionText = 'Available';
      statusColor = normalGreen;
      color = darkGreen;
    } else if (option == 1) {
      refText = 'busyText';
      optionText = 'Busy';
      statusColor = normalRed;
      color = darkRed;
    } else if (option == 2) {
      refText = 'offlineText';
      optionText = 'Offline';
      statusColor = normalGray;
      color = darkGray;
    }

    return (
      <Text
        style={[
          styles.statusText,
          {
            marginLeft:
              this.state.swipedStatus === option && this.props.windowState === 2
                ? -6
                : 0,
            backgroundColor: statusColor,
            color: color,
          },
        ]}
        ref={refText}>
        {optionText}
      </Text>
    );
  };

  render() {
    console.log(
      'in selfcard render, with stream: ',
      this.props.stream,
      'url',
      this.props.stream ? this.props.stream.toURL() : null,
    );
    //adjust colors and status text based on status
    let statusText = '?';
    if (this.props.status === 2) {
      statusText = 'offline';
      foregroundColor = normalGray;
      backgroundColor = fadedGray;
    } else if (this.props.status === 1) {
      statusText = 'busy';
      foregroundColor = normalRed;
      backgroundColor = fadedRed;
    } else if (this.props.status === 0) {
      statusText = 'available';
      foregroundColor = normalGreen;
      backgroundColor = fadedGreen;
    }

    //videoStatusCard
    //the video card either shows your video or your profile picture
    let hasStream =
      (this.props.status === 0 || this.props.status === 1) && this.props.stream;

    //in the case of no video:
    let videoCard = (
      <View
        style={{
          backgroundColor: foregroundColor,
          width: 100,
          height: 120,
        }}>
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            marginTop: 5,
          }}>
          <ProfilePicture
            picturePath={this.props.picturePath}
            name={this.props.name}
            size={70}
          />

          <Text
            style={{
              fontWeight: 'bold',
              marginTop: 5,
            }}>
            {this.props.name}
          </Text>

          <Text>is {statusText}</Text>
        </View>
      </View>
    );

    //if we are showing video:
    if (hasStream) {
      videoCard = (
        <RTCView
          style={styles.videoCard}
          streamURL={this.props.stream.toURL()}
          mirror={true}
        />
      );
    }

    let cameraSrc = this.props.mutedVideo
      ? require('./res/camera-gray.png')
      : require('./res/camera-white.png');
    let micSrc = this.props.mutedAudio
      ? require('./res/mic-gray.png')
      : require('./res/mic-white.png');

    //status card
    let statusCard = (
      <View
        style={{
          width: '100%',
          marginTop: 5,
        }}>
        {this.statusCardOption(0)}
        {this.statusCardOption(1)}
        {this.statusCardOption(2)}
        <View
          style={{
            height: 35,
            flexDirection: 'row',
            justifyContent: 'center',
            paddingTop: 2.5,
          }}>
          <TouchableOpacity
            style={styles.micCameraButton}
            onPress={this.toggleAudio.bind(this)}>
            <Image source={micSrc} style={styles.micCameraImage} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.micCameraButton}
            onPress={this.toggleVideo.bind(this)}>
            <Image source={cameraSrc} style={styles.micCameraImage} />
          </TouchableOpacity>
        </View>
      </View>
    );

    //create some colors based on the status that we've swiped
    //this is needed only by insideComponent
    let newStatusColor;
    if (this.state.swipedStatus === 2) {
      newStatusColor = normalGray;
    } else if (this.state.swipedStatus === 1) {
      newStatusColor = normalRed;
    } else if (this.state.swipedStatus === 0) {
      newStatusColor = normalGreen;
    }

    //insideComponent
    let insideComponent;
    if (this.props.windowState === 0) {
      insideComponent = (
        <View style={{alignItems: 'center', width: '100%'}}>{videoCard}</View>
      );
    } else if (this.props.windowState === 1) {
      insideComponent = (
        <View style={{alignItems: 'center', width: '100%'}}>
          {statusCard}
          {videoCard}
        </View>
      );
    } else if (this.props.windowState === 2) {
      insideComponent = (
        <View
          style={{flexDirection: 'row'}}
          ref={ref => {
            this.marker = ref;
          }}
          onLayout={event => {
            if (this.marker) {
              this.marker.measure((x, y, width, height, pageX, pageY) => {
                this.layoutOffset.x = pageX;
                this.layoutOffset.y = pageY;
              });
            }
          }}>
          <View
            style={{
              width: 40,
              flexDirection: 'column',
              backgroundColor: newStatusColor,
              marginRight: 6,
              marginBottom: 35 * (textStatusCard != null),
            }}>
            {this.timerOption(0)}
            {this.timerOption(1)}
            {this.timerOption(2)}
            {this.timerOption(3)}
            {this.timerOption(4)}
          </View>

          <View style={{alignItems: 'center'}}>
            {statusCard}
            {videoCard}
          </View>
        </View>
      );
    }

    //topBarComponent
    let topBarComponent = (
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: foregroundColor,
            height: 20,
          },
        ]}
      />
    );

    //textStatusCard
    let textStatusCard = null;

    //only make a textStatusCard if there's a text status
    textStatusCard = (
      <View
        style={{
          width: '100%',
          height: 35,
          marginBottom: 5,
        }}>
        <View
          style={[styles.textStatusCard, {backgroundColor: backgroundColor}]}>
          <TextInput
            style={styles.textStatusCardText}
            placeholder={'Enter status here...'}
            placeholderTextColor={'#bbb'}
            onChangeText={text => this.setState({textStatus: text})}
            onEndEditing={this.setTextStatus.bind(this)}
            value={this.state.textStatus ? this.state.textStatus : ''}
          />
        </View>
      </View>
    );

    //timerComponent
    let timerComponent =
      this.state.timedStatus !== 0 ? (
        <View
          style={{
            width: '100%',
            marginBottom: 5,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              width: 60,
              height: 30,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Image
              style={{width: 26, height: 26}}
              source={require('./res/timedStatus-black.png')}
            />
            <Text style={{fontSize: 12, color: 'black', marginRight: 5}}>
              {parseInt(this.state.timedStatus / 1000 / 60)}
            </Text>
          </View>
        </View>
      ) : null;

    let bottomBarComponent = (
      <View style={[styles.bottomBar, {backgroundColor: foregroundColor}]}>
        {textStatusCard}
        {timerComponent}
      </View>
    );

    return (
      <View
        style={[styles.cardHolderStyle, {backgroundColor: backgroundColor}]}
        {...this._panResponder.panHandlers}>
        {topBarComponent}
        {insideComponent}
        {bottomBarComponent}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  cardHolderStyle: {
    flexDirection: 'column',
    position: 'absolute',
    right: 10,
    bottom: 40,
    alignItems: 'center',
    borderRadius: 10,
  },
  videoImage: {
    height: '100%',
    width: '100%',
    backgroundColor: 'black',
  },
  videoCard: {
    width: 100,
    height: 100,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    height: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  bottomBar: {
    width: '100%',
    minHeight: 20,
    paddingTop: 5,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    flexDirection: 'column',
  },
  statusText: {
    height: 30,
    textAlign: 'center',
    textAlignVertical: 'center',
    marginBottom: 10,
  },
  textStatusCard: {
    position: 'absolute',
    right: 5,
    paddingLeft: 10,
    paddingRight: 10,
    height: '100%',
    borderRadius: 17.5,
  },
  textStatusCardText: {
    width: '100%',
    color: '#bbb',
    fontStyle: 'italic',
    fontSize: 12,
  },
  micCameraButton: {
    width: 25,
    height: 25,
    marginLeft: 6,
    marginRight: 6,
    backgroundColor: normalGray,
    borderRadius: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micCameraImage: {
    width: '80%',
    height: '80%',
  },
});
