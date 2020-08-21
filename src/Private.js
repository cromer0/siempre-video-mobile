import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {RTCView} from 'react-native-webrtc';
import {callManager} from './globals';

export default class Private extends React.Component {
  render() {
    let videoLayout;
    let idArray = Object.keys(this.props.inCall);
    let noCall = false;
    if (!this.props.isPrivate || idArray.length === 0) {
      videoLayout = (
        <Text style={{width: '60%', color: 'white', textAlign: 'center'}}>To start a private call, pull in an available friend from the commons area</Text>
      );   
      noCall = true;
    } else if (idArray.length === 1) {
      videoLayout = (
        <View style={[{height: '80%'}, styles.flexContainer]}>
          <RTCView style={styles.videoImage} streamURL={this.props.streams[idArray[0]].toURL()} />
        </View>
      );
    } else if (idArray.length === 2) {
      videoLayout = (
        <>
          <View style={[{height: '40%'}, styles.flexContainer]}>
            <RTCView style={styles.videoImage} streamURL={this.props.streams[idArray[0]].toURL()} />
          </View>
          <View style={[{height: '40%'}, styles.flexContainer]}>
            <RTCView style={styles.videoImage} streamURL={this.props.streams[idArray[1]].toURL()} />
          </View>
        </>
      );
    } else if (idArray.length === 3) {
      videoLayout = (
        <>
          <View style={[{height: '40%'}, styles.flexContainer]}>
            <RTCView style={styles.videoImage} streamURL={this.props.streams[idArray[0]].toURL()} />
          </View>
          <View style={[{height: '40%'}, styles.flexContainer]}>
            <RTCView style={styles.videoImage} streamURL={this.props.streams[idArray[1]].toURL()} />
            <RTCView style={styles.videoImage} streamURL={this.props.streams[idArray[2]].toURL()} />
          </View>
        </>
      );
    } else if (idArray.length >= 4) {
      videoLayout = (
        <>
          <View style={[{height: '40%'}, styles.flexContainer]}>
            <RTCView style={styles.videoImage} streamURL={this.props.streams[idArray[0]].toURL()} />
            <RTCView style={styles.videoImage} streamURL={this.props.streams[idArray[1]].toURL()} />
          </View>
          <View style={[{height: '40%'}, styles.flexContainer]}>
            {
              idArray.slice(2).map(id => {
                <RTCView style={styles.videoImage} streamURL={this.props.stream[id].toURL()} />
              })
            }
          </View>
        </>
      );
    }

    return (
      <View style={styles.mainContainer} ref="container">
        { videoLayout }
        { 
          noCall ? null :
            <TouchableOpacity style={styles.xContainer} onPress={() => callManager.exit()}>
              <Image source={require('./res/times.png')} style={{width: 30, height: 30}} />
            </TouchableOpacity>
        }
        
      </View>
    );
  }
}

const styles = StyleSheet.create({
  videoImage: {
    height: '100%',
    width: '100%',
    backgroundColor: 'black'
  },
  flexContainer: {
    flexDirection: 'row'
  },
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#3b3b3b'
  },
  xContainer: {
    position: 'absolute',
    bottom: 20,
    width: 40,
    height: 40,
    borderWidth: 2,
    borderRadius: 21,
    borderColor: 'red',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
