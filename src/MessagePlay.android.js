import React from 'react';
import {View, Image, StyleSheet, Platform} from 'react-native';
import Video from 'react-native-video';
import Sound from 'react-native-sound';

export default class MessagePlay extends React.Component {
  constructor(props) {
    super(props);

    this.isPlaying = false;
  }

  componentDidMount() {
    if (this.props.type === 'audio' && !this.isPlaying) {
      this.playAudio();
    }
  }

  componentDidUpdate() {
    if (this.props.type === 'audio' && !this.isPlaying) {
      this.playAudio();
    }
  }

  playAudio() {
    console.log('in play audio');
    this.isPlaying = true;
    var playAudio = new Sound(this.props.path, Sound.MAIN_BUNDLE, err => {
      if (err) {
        console.log('failed to load the sound', err);
        return;
      }

      console.log('duration in seconds: ' + playAudio.getDuration());

      playAudio.play(success => {
        if (success) {
          console.log('successfully finished playing');
          this.isPlaying = false;
          this.props.nextMessage();
        } else {
          console.log('playback failed due to audio decoding errors');
        }
      });
    });
  }

  render() {
    console.log(this.props);
    if (this.props.type === 'audio') {
      let soundSrc = require('./res/music-white.png');
      return (
        <View style={styles.centerContainer}>
          <Image style={styles.audioIcon} source={soundSrc} />
        </View>
      );
    } else if (this.props.type === 'video') {
      return (
        <View style={styles.centerContainer}>
          <Video
            style={styles.video}
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
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  video: {
    height: '90%',
    width: 160,
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
