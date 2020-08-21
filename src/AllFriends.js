import React from 'react';
import {View, Text, ScrollView, StyleSheet, findNodeHandle} from 'react-native';
import FriendCardRest from './FriendCardRest';

export default class AllFriends extends React.Component {
  render() {
    return (
      <ScrollView style={styles.scrollContainer} ref="container">
        <Text
          style={{
            fontSize: 32,
            color: 'white',
            paddingLeft: 30,
            paddingTop: 10,
            paddingBottom: 10,
          }}>
          Rest Area
        </Text>
        <View style={styles.mainContainer}>
          {Object.keys(this.props.friends).map(key => {
            let friendDict = this.props.friends[key];
            if (this.props.pluggedIn[key]) {
              return null;
            }

            return (
              <FriendCardRest
                key={key}
                id={key}
                ownId={this.props.id}
                name={friendDict['name']}
                picturePath={friendDict['profilePicturePath']}
                status={friendDict['status']}
                isActive={friendDict['active']}
                inCall={this.props.inCall[key]}
                location={'Home'}
                textStatus={null}
                switchPage={this.props.switchPage}
              />
            );
          })}
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3b3b3b',
  },
});
