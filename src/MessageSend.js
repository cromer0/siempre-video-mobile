import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {AudioRecorder, AudioUtils} from 'react-native-audio';
import {RNCamera} from 'react-native-camera';
import ProfilePicture from './ProfilePicture';
import {generateId, getConversationId} from './utils';

import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export default class MessageSend extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      recording: false,
      sendStatus: null,
    };
  }

  componentDidMount() {
    if (this.props.type === 'audio') {
      AudioRecorder.requestAuthorization().then(isAuthorized => {
        if (!isAuthorized) return;

        AudioRecorder.prepareRecordingAtPath(
          AudioUtils.DocumentDirectoryPath + '/test.aac',
          {
            SampleRate: 22050,
            Channels: 1,
            AudioQuality: 'Low',
            AudioEncoding: 'aac',
            OutputFormat: 'aac_adts',
            AudioEncodingBitRate: 32000,
          },
        );

        AudioRecorder.onFinished = data => {
          // Android callback is a promise
          if (Platform.OS === 'ios') {
            this.finishAudioRecording(data.status === 'OK', data.audioFileURL);
          }
        };
      });
    }
  }

  componentWillUnmount() {
    if (this.state.recording) {
      AudioRecorder.stopRecording();
    }
  }

  finishAudioRecording(didSucceed, filePath) {
    console.log('audio recording succeeded: ', didSucceed);
    this.setState({recording: false});
    if (filePath) {
      this.uploadMessage(filePath);
    }
  }

  uploadMessage(path) {
    this.setState({sendStatus: 'sending'});
    let messageId = generateId(20);
    let storagePath = 'messages/' + messageId;
    if (this.props.type === 'video') {
      storagePath += '.mp4';
    } else {
      storagePath += '.aac';
    }

    storage()
      .ref(storagePath)
      .putFile(path)
      .then(taskSnapshot => {
        if (taskSnapshot.state === storage.TaskState.SUCCESS) {
          let conversationId = getConversationId(
            this.props.ownId,
            this.props.id,
          );
          console.log('conversationId ' + conversationId);
          console.log('messageId ' + messageId);

          setTimeout(() => {
            this.props.returnToMenu();
          }, 3000);

          firestore()
            .doc('conversations/' + conversationId)
            .get()
            .then(doc => {
              if (doc.exists) {
                firestore().doc("conversations/" + conversationId + "/messages/" + messageId).set({
                  from: this.props.ownId,
                  to: this.props.id,
                  time: firestore.Timestamp.now(),
                  path: storagePath,
                  seen: false,
                  type: this.props.type
                })
                .then(() => {
                  console.log("set the message in firestore");
                  this.setState({ sendStatus: 'sent' });
                })
                .catch((err) => console.log("error setting document 1: " + err))
              } else {
                let usersMap = {
                  [this.props.ownId]: true,
                  [this.props.id]: true
                };
                firestore().doc("conversations/" + conversationId).set({
                  users: usersMap
                })
                .then(() => {
                  firestore().doc("conversations/" + conversationId + "/messages/" + messageId).set({
                    from: this.props.ownId,
                    to: this.props.id,
                    time: firestore.Timestamp.now(),
                    path: storagePath,
                    seen: false,
                    type: this.props.type
                  })
                  .then(() => this.setState({ sendStatus: 'sent' }))
                  .catch((err) => console.log("error setting document 2: " + err))
                })
                .catch((err) => console.log("error setting document 3 : " + err))
              }
            })
            .catch(err => {
              console.log('error getting document: ' + err);
            });
        }
      })
      .catch(err => {
        console.log('error uploading to storage', err);
        this.props.returnToMenu();
      });
  }

  stopAndSend() {
    if (this.props.type === 'audio') {
      if (this.state.recording) {
        let promiseOnAndroid = AudioRecorder.stopRecording();
        if (Platform.OS === 'android') {
          promiseOnAndroid
            .then(filePath => {
              this.finishAudioRecording(true, filePath);
            })
            .catch(err => {
              this.finishAudioRecording(false, null);
              console.log('audio record err', err);
            });
        }
      } else {
        AudioRecorder.startRecording();
        this.setState({recording: true});
      }
    } else if (this.props.type === 'video') {
      if (this.camera && !this.state.recording) {
        const options = {mirrorVideo: true, maxDuration: 30};
        this.camera
          .recordAsync(options)
          .then(data => {
            this.uploadMessage(data.uri);
          })
          .catch(err => {
            console.log(err);
          });
        this.setState({recording: true});
      } else if (this.state.recording) {
        this.camera.stopRecording();
        this.setState({recording: false});
      }
    }
  }

  render() {
    let sendSrc = require('./res/send.png');

    let middleComponent;
    if (this.props.type === 'audio') {
      middleComponent = (
        <Image
          style={styles.audioIcon}
          source={require('./res/music-white.png')}
        />
      );
    } else if (this.props.type === 'video') {
      middleComponent = (
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.camera}
          type={RNCamera.Constants.Type.front}
          flashMode={RNCamera.Constants.FlashMode.on}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          androidRecordAudioPermissionOptions={{
            title: 'Permission to use audio recording',
            message: 'We need your permission to use your audio',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
        />
      );
    }

    if (this.state.sendStatus) {
      let text = this.state.sendStatus === 'sending' ? 'Sending...' : 'Sent!';
      return (
        <View style={styles.column}>
          <Text style={styles.largeText}>{text}</Text>
        </View>
      );
    } else {
      return (
        <>
          <View style={styles.column}>
            <Text style={[styles.smallText, {marginBottom: 10}]}>
              Sending to:
            </Text>
            <ProfilePicture picturePath={this.props.picturePath} />
            <Text style={styles.largeText}>{this.props.name}</Text>
          </View>
          <View style={styles.column}>{middleComponent}</View>
          <View style={styles.column}>
            <TouchableOpacity
              onPress={this.stopAndSend.bind(this)}
              style={{
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              {!this.state.recording ? (
                <View style={styles.startContainer}>
                  <Text style={styles.largeText}>Start</Text>
                </View>
              ) : (
                <>
                  <Image style={styles.sendIcon} source={sendSrc} />
                  <Text style={styles.smallText}>Send</Text>
                </>
              )}
            </TouchableOpacity>
            {!this.state.recording ? (
              <TouchableOpacity onPress={this.props.returnToMenu}>
                <View style={[styles.startContainer, {borderColor: 'red'}]}>
                  <Text style={[styles.largeText, {color: 'red'}]}>Cancel</Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>
        </>
      );
    }
  }
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallText: {
    color: 'white',
    fontSize: 12,
  },
  largeText: {
    color: 'white',
    fontSize: 20,
  },
  sendIcon: {
    width: 50,
    height: 50,
  },
  audioIcon: {
    width: 70,
    height: 70,
  },
  camera: {
    width: 70,
    height: 70,
  },
  startContainer: {
    margin: 5,
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
