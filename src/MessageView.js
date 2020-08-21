import React from 'react';
import {View, Image, Text, StyleSheet, TouchableOpacity} from 'react-native';

import MessagePlay from './MessagePlay';
import {getConversationId} from './utils';

import RNFetchBlob from 'rn-fetch-blob';
import firestore from '@react-native-firebase/firestore';

export default class MessageView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentMessageIdx: 0,
      messageURLs: null,
    };
  }

  playNextMessage() {
    if (this.state.currentMessageIdx === this.props.messages.length - 1) {
      let conversationId = getConversationId(this.props.ownId, this.props.id);
      let paths = this.props.messages.map(message => {
        return this.props.messagePaths[message.id];
      });
      let markRead = this.props.messages.map(message => {
        return firestore()
          .doc('conversations/' + conversationId + '/messages/' + message.id)
          .update({seen: true});
      });

      Promise.all(markRead)
        .then(() => {
          let unlinks = paths.map(path => {
            return RNFetchBlob.fs.unlink(path);
          });
          return Promise.all(unlinks);
        })
        .then(() => {
          console.log('successfully removed messages');
        })
        .catch(err => {
          console.log('Error in deleting messages', err);
        });

      this.props.returnToMenu();
    } else {
      this.setState({currentMessageIdx: this.state.currentMessageIdx + 1});
    }
  }

  render() {
    let backSrc;
    if (this.props.isRed) {
      backSrc = require('./res/back-white.png');
    } else {
      backSrc = require('./res/back-red.png');
    }

    let redColor = this.props.isRed ? 'white' : 'red';
    let currentMessage = this.props.messages[this.state.currentMessageIdx];

    return (
      <>
        <View style={styles.column}>
          <Text style={styles.nameText}>{this.props.name}</Text>
          <TouchableOpacity
            style={[{borderColor: redColor}, styles.backIconContainer]}
            onPress={this.props.returnToMenu}>
            <Image style={styles.backIcon} source={backSrc} />
          </TouchableOpacity>
        </View>
        {currentMessage.id in this.props.messagePaths ? (
          <MessagePlay
            nextMessage={this.playNextMessage.bind(this)}
            type={currentMessage.type}
            path={this.props.messagePaths[currentMessage.id]}
          />
        ) : null}
        <View style={styles.textContainer}>
          <Text style={styles.textStyle}>
            {this.state.currentMessageIdx +
              1 +
              ' / ' +
              this.props.messages.length}
          </Text>
        </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  column: {
    flexDirection: 'column',
    paddingRight: 30,
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
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20,
  },
  textStyle: {
    fontSize: 16,
    color: 'white',
  },
});
