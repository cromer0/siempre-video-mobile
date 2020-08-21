import React from 'react';
import {View, Image, Text, StyleSheet} from 'react-native';

import storage from '@react-native-firebase/storage';

export default class ProfilePicture extends React.Component {
  constructor(props) {
    super(props);

    this.state = {pictureURL: null};
    this.unmounted = false;
  }

  componentDidMount() {
    this.unmounted = false;
    if (this.props.picturePath) {
      storage()
        .ref(this.props.picturePath)
        .getDownloadURL()
        .then(url => {
          if (!this.unmounted) {
            this.setState({
              pictureURL: url,
            });
          }
        })
        .catch(err => console.log('error getting prof pic', err));
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  render() {
    let size = 50;
    if (this.props.size) {
      console.log('passed in size');
      size = this.props.size;
    }

    let initials = '?';
    if (this.props.name) {
      initials = this.props.name.charAt(0);
    }

    if (this.state.pictureURL) {
      return (
        <Image
          style={{
            borderRadius: size / 2,
            width: size,
            height: size,
          }}
          source={{uri: this.state.pictureURL}}
        />
      );
    } else {
      return (
        <View
          style={{
            backgroundColor: 'gray',
            borderRadius: size / 2,
            width: size,
            height: size,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text
            style={{
              fontSize: 0.15 * Math.max(size, 100),
              color: 'black',
              textAlign: 'center',
            }}>
            {initials}
          </Text>
        </View>
      );
    }
  }
}
