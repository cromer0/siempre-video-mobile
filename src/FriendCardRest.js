import React from 'react';
import {Animated, View, Image, Text, PanResponder, StyleSheet, findNodeHandle } from 'react-native';
import { gestureIsClick, getSwipeDirection } from './utils';
import { NOT_SCROLL_THRESHOLD, SCROLL_RATIO_THRESHOLD, HOLD_THRESHOLD, SWIPE_THRESHOLD, SWIPE_RATIO_THRESHOLD, SCREEN_WIDTH, SCREEN_HEIGHT, MOVE_THRESHOLD } from './constants';
import ProfilePicture from './ProfilePicture';

import firestore from '@react-native-firebase/firestore';

export default class FriendCard extends React.Component {
  constructor(props) {
    super(props);

    this.startTimestamp = null;
    this.inMoveMode = false;
    this.moveDirection = null;
    this.position = new Animated.ValueXY();
    this.timeAnimate = new Animated.Value(0);
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        console.log('friend onstart');
        this.startTimestamp = evt.nativeEvent.timestamp;
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        console.log('friend onmove');
        if (evt.nativeEvent.timestamp - this.startTimestamp >= NOT_SCROLL_THRESHOLD && gestureIsClick(gestureState)) {
          return true;
        } else {
          let ratio = Math.abs(gestureState.dy) / Math.abs(gestureState.dx);
          console.log('friend onmove ratio ', ratio, 'threshold', SCROLL_RATIO_THRESHOLD);
          return ratio < SCROLL_RATIO_THRESHOLD;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        console.log('frinedOnPanResponderMove in move', this.inMoveMode, 'is click' , gestureIsClick(gestureState), 'movedirection', this.moveDirection, evt.nativeEvent.timestamp - this.startTimestamp);
        if (this.inMoveMode) {
          if (this.moveDirection === 'horizontal') {
            this.position.setValue({ x: gestureState.dx, y: 0 });
          } else if (this.moveDirection === 'vertical') {
            this.position.setValue({ x: 0, y: gestureState.dy });
          } else {
            if (Math.abs(gestureState.dx) / Math.abs(gestureState.dy) > SWIPE_RATIO_THRESHOLD
                && Math.abs(gestureState.dx) >= MOVE_THRESHOLD) {
              this.moveDirection = 'horizontal';
            } else if (Math.abs(gestureState.dy) / Math.abs(gestureState.dx) > SWIPE_RATIO_THRESHOLD
                      && Math.abs(gestureState.dy) >= MOVE_THRESHOLD) {
              this.moveDirection = 'vertical';
            }
          }
        } else if (gestureIsClick(gestureState)) {
          if (evt.nativeEvent.timestamp - this.startTimestamp >= HOLD_THRESHOLD) {
            this.inMoveMode = true;
            this.timeAnimate.setValue(HOLD_THRESHOLD);
          } else {
            this.timeAnimate.setValue(evt.nativeEvent.timestamp - this.startTimestamp);
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log('friendcard onpanrepsonderrelease');
        if (this.inMoveMode) {
          if (gestureState.dx >= SWIPE_THRESHOLD) {
            this.plugIn();
          } else {
            this.resetPosition();
          }
          console.log('friendcard hold event');
        } else {
          let swipeDirection = getSwipeDirection(gestureState);
          console.log('friendcard onpanrepsonderrelease ', swipeDirection, evt.target);
          if (swipeDirection === "SWIPE_RIGHT") {
            this.props.switchPage(true);
          } else if (swipeDirection === "SWIPE_LEFT") {
            this.props.switchPage(false); 
          } else {
            this.resetPosition();
          }
        }
        this.startTimestamp = null;
        this.inMoveMode = false;
        this.moveDirection = null;
        this.timeAnimate.setValue(0);
      }
    });
  }

  resetPosition() {
    Animated.spring(this.position, {
      toValue: { x: 0, y: 0 }
    }).start()
  }

  plugIn() {
    Animated.spring(this.position, {
      toValue: { x: SCREEN_WIDTH, y: 0}
    }).start()
    
    let pluggedKey = 'pluggedIn.' + this.props.id;
    firestore().doc('users/' + this.props.ownId)
      .update({ [pluggedKey]: true});
  }

  animatedStyle() {
    const { position, timeAnimate } = this;
    const yOffset = position.y.interpolate({
      inputRange: [-SCREEN_HEIGHT, SCREEN_HEIGHT],
      outputRange: [-SCREEN_HEIGHT, SCREEN_HEIGHT]
    });
    const xOffset = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      outputRange: [0, 0, SCREEN_WIDTH]
    });
    const borderSize = timeAnimate.interpolate({
      inputRange: [0, HOLD_THRESHOLD - 1, HOLD_THRESHOLD],
      outputRange: [0, 0.5, 1]
    });

    return {
      transform: [{ translateY: yOffset }, { translateX: xOffset }],
      borderColor: 'black',
      borderWidth: borderSize
    };
  }

  statusColor = function(shaded){
    let status = this.props.status;
    if (!this.props.isActive) {
      status = 2;
    }

    if (this.props.inCall) {
      if (shaded === null) {
        return '#007FAC';
      }
      else if (shaded === 'lighter'){
        return '#1ca9db';
      }
      else if (shaded === 'darker'){
        return '#006183';
      }
    }

    if (status === 0) {
      if(shaded === null) {
        return '#00B050';;
      }
      else if (shaded === 'lighter') {
        return '#00ce5e';
      }
      else if (shaded === 'darker') {
        return '#006d32';
      }
    } else if (status === 1) {
      if(shaded === null) {
        return '#ff0000';
      }
      else if (shaded === 'lighter') {
        return '#ff8181';
      }
      else if (shaded === 'darker') {
        return '#B40000';
      }
    } else {
      if (shaded === null) {
        return '#6e6e6e';
      }
      else if (shaded === 'lighter') {
        return '#afafaf';
      }
      else if (shaded === 'darker') {
        return '#4b4b4b';
      }
    }
    return 'black';
  }

  cardStyle = function(){
    return {
      position: 'absolute',
      marginTop: 5,
      marginBottom: 5,
      height: 40,
      width: '100%',
      backgroundColor: this.statusColor(null),
      borderWidth: 0,
      borderRadius: 25,
      flexDirection: 'row',
      fontSize: 14,
      fontWeight: 'bold'       
    }
  }

  render() {
    return (
      <Animated.View
        style={this.animatedStyle()}
        {...this._panResponder.panHandlers}
      >
        <View style={{
          minWidth: '90%',
          height: 50,
          marginTop: 5,
          marginBottom: 5,
        }}>

          <View style={this.cardStyle()}>
          
            <View style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 40,
              height: 40,
              borderRadius: 25,
            }}>
              <View style={{
                position: 'absolute',
                left: 10,
                width: 20,
                height: 20,
                marginTop: 10,
                borderRadius: 10,
                backgroundColor: this.statusColor('lighter'),
              }}>
                <Text 
                  style={{
                    fontSize: 15,
                    color: this.statusColor('darker'),
                    textAlign: 'center'}}>
                  {this.props.numMessages}
                </Text>
              </View>
            </View>

            <View style={{
                position: 'absolute',
                left: 100,
                marginTop: 10,
              }}>
              <Text 
                style={{
                  fontSize: 15,
                  color: 'black',
                  textAlign: 'center'}}>
                {this.props.name}
              </Text>
            </View>

          </View>
          
          <View style={{
            left: 40,
            position: 'absolute',
          }}>
            <ProfilePicture picturePath={this.props.picturePath}/>
          </View>
        </View>
      </Animated.View>
    )
  }
}
