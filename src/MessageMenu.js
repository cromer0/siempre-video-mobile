import React from 'react';
import {View, Image, Text, StyleSheet, TouchableOpacity} from 'react-native';
import MessageView from './MessageView';
import MessageSend from './MessageSend';

export default class MessageMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {whichPage: 'menu'};
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.whichPage !== this.state.whichPage) {
      if (this.state.whichPage === "recordAudio" || this.state.whichPage === "recordVideo") {
        this.props.updateRecordingMessage(true);
      } else {
        this.props.updateRecordingMessage(false);
      }
    }
  }

  returnToMenu() {
    this.setState({whichPage: 'menu'});
  }

  render() {
    let hasMessage = this.props.messages && this.props.messages.length > 0;
    let isRed = this.props.status === 1;
    let backSrc;
    if (isRed) {
      backSrc = require('./res/back-white.png');
    } else {
      backSrc = require('./res/back-red.png');
    }
    let playSrc = require('./res/play-white.png');
    let videoSrc = require('./res/video-white.png');
    let micSrc = require('./res/mic-white.png');

    let playOpacity = hasMessage ? 1 : 0.5;
    let messageColor = isRed ? '#ff8181' : 'red';
    let iconColor = isRed ? 'white' : 'red';

    let mainComponent;
    if (this.state.whichPage === 'menu') {
      mainComponent = (
        <>
          <View style={styles.menuColumn}>
            <Text style={styles.nameText}>{this.props.name}</Text>
            <TouchableOpacity
              style={[{borderColor: iconColor}, styles.backIconContainer]}
              onPress={this.props.exitMenu}>
              <Image style={styles.backIcon} source={backSrc} />
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.menuColumn,
              styles.menuButtonColumn,
              {opacity: playOpacity},
            ]}>
            <TouchableOpacity
              style={styles.bigIconContainer}
              onPress={() => {
                this.setState({whichPage: 'play'});
              }}>
              <Image style={styles.bigIcon} source={playSrc} />
              {hasMessage ? (
                <View
                  style={[
                    {backgroundColor: messageColor},
                    styles.numMessageContainer,
                  ]}>
                  <Text style={styles.numMessageText}>
                    {this.props.messages.length}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <Text style={styles.menuText}>Play messages</Text>
          </View>
          <View style={[styles.menuColumn, styles.menuButtonColumn]}>
            <TouchableOpacity
              style={styles.bigIconContainer}
              onPress={() => {
                this.setState({whichPage: 'recordVideo'});
              }}>
              <Image style={styles.bigIcon} source={videoSrc} />
            </TouchableOpacity>
            <Text style={styles.menuText}>Send video message</Text>
          </View>
          <View style={[styles.menuColumn, styles.menuButtonColumn]}>
            <TouchableOpacity
              style={styles.bigIconContainer}
              onPress={() => {
                this.setState({whichPage: 'recordAudio'});
              }}>
              <Image style={styles.bigIcon} source={micSrc} />
            </TouchableOpacity>
            <Text style={styles.menuText}>Send audio message</Text>
          </View>
        </>
      );
    } else if (this.state.whichPage === 'play') {
      mainComponent = (
        <MessageView
          id={this.props.id}
          ownId={this.props.ownId}
          name={this.props.name}
          messages={this.props.messages}
          messagePaths={this.props.messagePaths}
          returnToMenu={this.returnToMenu.bind(this)}
          isRed={isRed}
        />
      );
    } else if (this.state.whichPage === 'recordAudio') {
      mainComponent = (
        <MessageSend
          id={this.props.id}
          ownId={this.props.ownId}
          name={this.props.name}
          picturePath={this.props.picturePath}
          returnToMenu={this.returnToMenu.bind(this)}
          type="audio"
        />
      );
    } else if (this.state.whichPage === 'recordVideo') {
      mainComponent = (
        <MessageSend
          id={this.props.id}
          ownId={this.props.ownId}
          name={this.props.name}
          picturePath={this.props.picturePath}
          returnToMenu={this.returnToMenu.bind(this)}
          type="video"
        />
      );
    }

    return <View style={styles.messageMenuContainer}>{mainComponent}</View>;
  }
}

const styles = StyleSheet.create({
  messageMenuContainer: {
    flexDirection: 'row',
    height: 150,
  },
  menuColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  menuButtonColumn: {
    alignItems: 'center',
  },
  nameText: {
    fontSize: 25,
    color: 'white',
    marginTop: 15,
    marginLeft: 20,
  },
  backIconContainer: {
    position: 'absolute',
    marginLeft: 20,
    bottom: 15,
    width: 40,
    height: 40,
    borderWidth: 2,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  bigIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b3b3b',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  bigIcon: {
    width: 40,
    height: 40,
  },
  menuText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'white',
  },
  numMessageContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numMessageText: {
    fontSize: 12,
    color: 'white',
  },
});
