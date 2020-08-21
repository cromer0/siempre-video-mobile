import React from 'react';
import {View, Image, StyleSheet, Platform} from 'react-native';
import Video from 'react-native-video';
import OGVPlayer from './OGVPlayer';

import InCallManager from 'react-native-incall-manager';

export default class MessagePlay extends React.Component {
  componentDidMount() {
    InCallManager.start({media: 'video'});
  }

  render() {
    return (
      <View style={styles.centerContainer}>
        {this.props.type === 'audio' ? (
          <Image style={styles.audioIcon} source={MessagePlay.kSoundIcon} />
        ) : null}
        {Platform.OS === 'ios' && this.props.path.endsWith('.webm') ? (
          <OGVPlayer
            style={
              this.props.type === 'video' ? styles.video : styles.hiddenVideo
            }
            sourceURL={this.props.path}
            onEnded={() => {
              console.log('video ended');
              this.props.nextMessage();
            }}
          />
        ) : (
          <Video
            style={
              this.props.type === 'video' ? styles.video : styles.hiddenVideo
            }
            source={{uri: this.props.path}}
            onEnd={() => {
              console.log('video ended');
              this.props.nextMessage();
            }}
            onLoadStart={info => console.log('starting load ', info)}
            onLoad={info => console.log('video loaded ', info)}
            onReadyForDisplay={() => console.log('video ready for display')}
            onError={err => console.log('video load error', err)}
          />
        )}
      </View>
    );
  }
}

MessagePlay.kSoundIcon = require('./res/music-white.png');

const styles = StyleSheet.create({
  video: {
    height: '90%',
    width: 160,
  },
  hiddenVideo: {
    height: 0,
    width: 0,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 160,
  },
  audioIcon: {
    height: 70,
    width: 70,
  },
});
