import React from 'react';
import {
  Animated,
  View,
  Image,
  Text,
  PanResponder,
  StyleSheet,
  findNodeHandle,
} from 'react-native';
import {getConversationId, gestureIsClick, getSwipeDirection} from './utils';
import {
  NOT_SCROLL_THRESHOLD,
  SCROLL_RATIO_THRESHOLD,
  HOLD_THRESHOLD,
  SWIPE_THRESHOLD,
  SWIPE_RATIO_THRESHOLD,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  MOVE_THRESHOLD,
} from './constants';
import ProfilePicture from './ProfilePicture';
import MessageMenu from './MessageMenu';

import {callManager} from './globals';

import RNFetchBlob from 'rn-fetch-blob';
import AsyncStorage from '@react-native-community/async-storage';
import {RTCView} from 'react-native-webrtc';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export default class FriendCard extends React.Component {
  constructor(props) {
    super(props);

    this.startTimestamp = null;
    this.touchingStatus = false;
    this.inMoveMode = false;
    this.moveDirection = null;
    this.position = new Animated.ValueXY();
    this.timeAnimate = new Animated.Value(0);
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        console.log('friend onstart');

        this.startTimestamp = evt.nativeEvent.timestamp;
        console.log(
          'target',
          evt.nativeEvent.target,
          'statusbutton',
          findNodeHandle(this.refs.statusButton),
          'statustext',
          findNodeHandle(this.refs.statusText),
        );
        if (
          evt.nativeEvent.target === findNodeHandle(this.refs.statusButton) ||
          evt.nativeEvent.target === findNodeHandle(this.refs.statusText)
        ) {
          this.touchingStatus = true;
          return true;
        }
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        console.log('friend onmove');

        if (
          evt.nativeEvent.timestamp - this.startTimestamp >=
            NOT_SCROLL_THRESHOLD &&
          gestureIsClick(gestureState)
        ) {
          return true;
        } else {
          let ratio = Math.abs(gestureState.dy) / Math.abs(gestureState.dx);
          console.log(
            'friend onmove ratio ',
            ratio,
            'threshold',
            SCROLL_RATIO_THRESHOLD,
          );
          return ratio < SCROLL_RATIO_THRESHOLD;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        console.log(
          'frinedOnPanResponderMove in move',
          this.inMoveMode,
          'is click',
          gestureIsClick(gestureState),
          'movedirection',
          this.moveDirection,
          evt.nativeEvent.timestamp - this.startTimestamp,
        );

        if (this.touchingStatus) {
          if (
            evt.nativeEvent.timestamp - this.startTimestamp >=
            HOLD_THRESHOLD
          ) {
            this.touchingStatus = false;
            this.setState({inMessageMenu: true});
          }
        } else {
          if (this.inMoveMode) {
            if (this.moveDirection === 'horizontal') {
              this.position.setValue({x: gestureState.dx, y: 0});
            } else if (this.moveDirection === 'vertical') {
              this.position.setValue({x: 0, y: gestureState.dy});
            } else {
              if (
                Math.abs(gestureState.dx) / Math.abs(gestureState.dy) >
                  SWIPE_RATIO_THRESHOLD &&
                Math.abs(gestureState.dx) >= MOVE_THRESHOLD
              ) {
                this.moveDirection = 'horizontal';
              } else if (
                Math.abs(gestureState.dy) / Math.abs(gestureState.dx) >
                  SWIPE_RATIO_THRESHOLD &&
                Math.abs(gestureState.dy) >= MOVE_THRESHOLD
              ) {
                this.moveDirection = 'vertical';
              }
            }
          } else if (gestureIsClick(gestureState)) {
            if (
              evt.nativeEvent.timestamp - this.startTimestamp >=
              HOLD_THRESHOLD
            ) {
              this.inMoveMode = true;
              this.timeAnimate.setValue(HOLD_THRESHOLD);
              this.props.updateMoveMode(true);
            } else {
              this.timeAnimate.setValue(
                evt.nativeEvent.timestamp - this.startTimestamp,
              );
            }
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log('friendcard onpanrepsonderrelease');

        if (this.touchingStatus) {
          if (
            evt.nativeEvent.timestamp - this.startTimestamp <
            HOLD_THRESHOLD
          ) {
            console.log('clicked button');
            this.toggleCall();
          }
        } else if (this.inMoveMode) {
          if (gestureState.dx <= -1 * SWIPE_THRESHOLD) {
            this.plugOut();
          } else if (gestureState.dx >= SWIPE_THRESHOLD) {
            if (this.props.status === 0 && this.props.myStatus !== 2) {
              this.enterPrivateCall();
              this.props.switchPage(false);
            } else {
              this.resetPosition();
            }
          } else if (this.moveDirection === 'vertical') {
            this.props.reorder(evt.nativeEvent.pageY);
            this.resetPosition();
          } else {
            this.resetPosition();
          }
          console.log('friendcard hold event');
        } else {
          let swipeDirection = getSwipeDirection(gestureState);
          console.log(
            'friendcard onpanrepsonderrelease ',
            swipeDirection,
            evt.target,
          );
          if (swipeDirection === 'SWIPE_RIGHT') {
            this.props.switchPage(true);
          } else if (swipeDirection === 'SWIPE_LEFT') {
            this.props.switchPage(false);
          } else {
            this.resetPosition();
          }
        }

        this.touchingStatus = false;
        this.startTimestamp = null;
        this.inMoveMode = false;
        this.props.updateMoveMode(false);
        this.moveDirection = null;
        this.timeAnimate.setValue(0);

        this.props.switchSelfVideoState(0);
      },
    });

    this.state = {
      messages: null,
      messagePaths: {},
      inMessageMenu: false,
    };
  }

  componentDidMount() {
    this.initConversationsListener();
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  initConversationsListener() {
    if (this.props.id && this.props.ownId) {
      let conversationId = getConversationId(this.props.id, this.props.ownId);
      this.unsubscribe = firestore()
        .doc('conversations/' + conversationId)
        .collection('messages')
        .where('seen', '==', false)
        .where('to', '==', this.props.ownId)
        .orderBy('time')
        .onSnapshot(
          querySnapshot => {
            var messages = [];
            querySnapshot.forEach(doc => {
              messages.push({
                id: doc.id,
                path: doc.data().path,
                type: doc.data().type,
                time: doc.data().time,
              });

              AsyncStorage.getItem('messages/' + doc.id).then(value => {
                let fetchAndCache = () => {
                  storage()
                    .ref(doc.data().path)
                    .getDownloadURL()
                    .then(url => {
                      let urlWithoutQuery = url.substring(
                        0,
                        url.lastIndexOf('?'),
                      );
                      let ext = urlWithoutQuery.substring(
                        urlWithoutQuery.lastIndexOf('.') + 1,
                      );
                      return RNFetchBlob.config({
                        fileCache: true,
                        appendExt: ext,
                      }).fetch('GET', url, {});
                    })
                    .then(res => {
                      let localPath = res.path();
                      this.setState(prevState => {
                        let tempMap = prevState.messagePaths;
                        tempMap[doc.id] = localPath;
                        return {messagePaths: tempMap};
                      });

                      AsyncStorage.setItem('messages/' + doc.id, localPath);
                    });
                };

                if (value !== null) {
                  RNFetchBlob.fs.exists(value).then(exists => {
                    if (exists) {
                      this.setState(prevState => {
                        let tempMap = prevState.messagePaths;
                        tempMap[doc.id] = value;
                        return {messagePaths: tempMap};
                      });
                    } else {
                      fetchAndCache();
                    }
                  });
                } else {
                  fetchAndCache();
                }
              });
            });
            this.setState({messages: messages});
          },
          err =>
            console.log(
              'snapshot error ' +
                getConversationId(this.props.ownId, this.props.id) +
                ': ' +
                err,
            ),
        );
    }
  }

  toggleCall() {
    if (this.props.inCall) {
      console.log('exit call');
      callManager.exit();
    } else {
      console.log('enter call');
      callManager.enter(this.props.id, false); // TODO isPrivate
    }
  }

  enterPrivateCall() {
    callManager.enter(this.props.id, true);
  }

  resetPosition() {
    Animated.spring(this.position, {
      toValue: {x: 0, y: 0},
    }).start();
  }

  plugOut() {
    Animated.spring(this.position, {
      toValue: {x: -1 * SCREEN_WIDTH, y: 0},
    }).start();

    let pluggedKey = 'pluggedIn.' + this.props.id;
    firestore()
      .doc('users/' + this.props.ownId)
      .update({[pluggedKey]: false});
  }

  animatedStyle() {
    const {position, timeAnimate} = this;
    const yOffset = position.y.interpolate({
      inputRange: [-SCREEN_HEIGHT, SCREEN_HEIGHT],
      outputRange: [-SCREEN_HEIGHT, SCREEN_HEIGHT],
    });
    const xOffset = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    });
    const borderSize = timeAnimate.interpolate({
      inputRange: [0, HOLD_THRESHOLD - 1, HOLD_THRESHOLD],
      outputRange: [0, 0.5, 1],
    });
    const zIndex = timeAnimate.interpolate({
      inputRange: [0, HOLD_THRESHOLD - 1, HOLD_THRESHOLD],
      outputRange: [0, 1, 1],
    });

    return {
      transform: [{translateY: yOffset}, {translateX: xOffset}],
      borderColor: 'black',
      borderWidth: borderSize,
      zIndex: zIndex,
    };
  }

  statusColor = function(shaded) {
    let status = this.props.status;
    if (!this.props.isActive) {
      status = 2;
    }

    if (this.props.inCall) {
      if (shaded === null) {
        return '#007FAC';
      } else if (shaded === 'lighter') {
        return '#1ca9db';
      } else if (shaded === 'darker') {
        return '#006183';
      }
    }

    if (status === 0) {
      if (shaded === null) {
        return '#00B050';
      } else if (shaded === 'lighter') {
        return '#00ce5e';
      } else if (shaded === 'darker') {
        return '#006d32';
      }
    } else if (status === 1) {
      if (shaded === null) {
        return '#ff0000';
      } else if (shaded === 'lighter') {
        return '#ff8181';
      } else if (shaded === 'darker') {
        return '#B40000';
      }
    } else {
      if (shaded === null) {
        return '#6e6e6e';
      } else if (shaded === 'lighter') {
        return '#afafaf';
      } else if (shaded === 'darker') {
        return '#4b4b4b';
      }
    }
    return 'black';
  };

  cardStyle = function() {
    if (this.state.inMessageMenu) {
      return {
        minWidth: '90%',
        backgroundColor: this.statusColor(null),
        borderRadius: 20,
        marginTop: 10,
        marginBottom: 10,
      };
    } else if (this.props.videoOn) {
      return {
        minWidth: '90%',
        height: 200,
        backgroundColor: this.statusColor(null),
        borderWidth: 0,
        borderRadius: 20,
        marginLeft: 20,
        marginRight: 20,
        marginTop: 10,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      };
    } else {
      return {
        minWidth: '90%',
        height: 50,
        borderWidth: 0,
        marginTop: 5,
        marginBottom: 5,
        flexDirection: 'row',
        alignItems: 'center',
      };
    }
  };

  exitMenu() {
    this.setState({inMessageMenu: false});
  }

  render() {
    if (this.state.inMessageMenu) {
      return (
        <View style={this.cardStyle()}>
          <MessageMenu
            id={this.props.id}
            ownId={this.props.ownId}
            name={this.props.name}
            messages={this.state.messages}
            messagePaths={this.state.messagePaths}
            exitMenu={this.exitMenu.bind(this)}
            status={this.props.status}
            picturePath={this.props.picturePath}
            updateRecordingMessage={this.props.updateRecordingMessage}
          />
        </View>
      );
    }

    let textStatusCard = null;
    if (this.props.textStatus) {
      if (this.props.videoOn) {
        textStatusCard = (
          <View
            style={[
              styles.textStatusCard,
              {
                left: 50,
                bottom: 15,
              },
            ]}>
            <Text style={styles.textStatusCardText}>
              {this.props.textStatus}
            </Text>
          </View>
        );
      } else {
        textStatusCard = (
          <View style={[styles.textStatusCard]}>
            <Text style={styles.textStatusCardText}>
              {this.props.textStatus}
            </Text>
          </View>
        );
      }
    }

    let innerComponent;
    if (this.props.videoOn) {
      innerComponent = (
        <View style={this.cardStyle()}>
          <View
            style={[
              styles.statusButton,
              {
                backgroundColor: this.statusColor('lighter'),
                borderColor: '#00000000',
                position: 'absolute',
                bottom: 0,
                left: 0,
                zIndex: 5,
              },
            ]}
            ref="statusButton">
            <Text
              style={[styles.statusText, {color: this.statusColor('darker')}]}
              ref="statusText">
              {this.state.messages && this.state.messages.length > 0
                ? this.state.messages.length
                : null}
            </Text>
          </View>
          {this.props.stream ? (
            <RTCView
              style={styles.videoImage}
              streamURL={this.props.stream.toURL()}
            />
          ) : (
            <View style={styles.videoImage} />
          )}
        </View>
      );
    } else {
      if (textStatusCard == null) {
        innerComponent = (
          <View style={this.cardStyle()}>
            <View
              style={{
                position: 'absolute',
                backgroundColor: this.statusColor(null),
                height: 40,
                width: '100%',
                borderRadius: 25,
              }}
            />
            <View
              style={[
                styles.statusButton,
                {
                  backgroundColor: this.statusColor('lighter'),
                  borderColor: this.statusColor(null),
                },
              ]}
              ref="statusButton">
              <Text
                style={[styles.statusText, {color: this.statusColor('darker')}]}
                ref="statusText">
                {this.state.messages && this.state.messages.length > 0
                  ? this.state.messages.length
                  : null}
              </Text>
            </View>
            <View>
              <ProfilePicture
                picturePath={this.props.picturePath}
                name={this.props.name}
              />
            </View>
            <View style={{paddingLeft: 10}}>
              <Text style={[styles.statusText, {color: 'black'}]}>
                {this.props.name}
              </Text>
            </View>
          </View>
        );
      } else {
        innerComponent = (
          <View
            style={{
              minWidth: '90%',
              height: 105,
              borderWidth: 0,
              borderRadius: 0,
              marginTop: 5,
              marginBottom: 5,
              paddingTop: 5,
            }}>
            <View
              style={{
                position: 'absolute',
                marginTop: 5,
                backgroundColor: this.statusColor(null),
                height: 95,
                width: '100%',
                borderRadius: 25,
              }}
            />
            <View
              style={{
                height: 40,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <View
                style={[
                  styles.statusButton,
                  {
                    backgroundColor: this.statusColor('lighter'),
                    borderColor: this.statusColor(null),
                  },
                ]}
                ref="statusButton">
                <Text
                  style={[
                    styles.statusText,
                    {color: this.statusColor('darker')},
                  ]}
                  ref="statusText">
                  {this.state.messages && this.state.messages.length > 0
                    ? this.state.messages.length
                    : null}
                </Text>
              </View>
              <View>
                <ProfilePicture
                  picturePath={this.props.picturePath}
                  name={this.props.name}
                />
              </View>
              <View style={{paddingLeft: 10}}>
                <Text style={[styles.statusText, {color: 'black'}]}>
                  {this.props.name}
                </Text>
              </View>
            </View>
          </View>
        );
      }
    }

    return (
      <Animated.View
        style={this.animatedStyle()}
        onLayout={evt =>
          this.props.updateLayout(
            evt.nativeEvent.layout.y,
            evt.nativeEvent.layout.height,
          )
        }
        {...this._panResponder.panHandlers}>
        {innerComponent}
        {textStatusCard}
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  videoImage: {
    height: '100%',
    width: '100%',
  },
  statusButton: {
    width: 40,
    height: 40,
    borderWidth: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 15,
    textAlign: 'center',
  },
  textStatusCard: {
    position: 'absolute',
    height: 30,
    bottom: 20,
    left: 0,
    marginLeft: 10,
    borderRadius: 15,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: '#333333aa',
    justifyContent: 'center',
  },
  textStatusCardText: {
    width: '100%',
    color: '#bbb',
    fontStyle: 'italic',
    fontSize: 12,
  },
});
