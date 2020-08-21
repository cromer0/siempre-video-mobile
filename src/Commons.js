import React from 'react';
import {View, Text, ScrollView, StyleSheet, findNodeHandle} from 'react-native';

import {StreamState} from 'siemprevideo-streamlib';

import FriendCard from './FriendCard';

export default class Commons extends React.Component {
  constructor(props) {
    super(props);

    this.layoutMap = {};
    this.yOffset = 0;
    this.state = {
      friendOrdering: [],
      inMoveMode: false,
    };
  }

  static getDerivedStateFromProps(props, state) {
    return {
      friendOrdering: Commons.reorderWithStatus(props.friends),
    };
  }

  static reorderWithStatus(friends) {
    let returnIds = [];
    Object.keys(friends).forEach(id => {
      if (friends[id].status !== 2) {
        returnIds.push(id);
      }
    });
    Object.keys(friends).forEach(id => {
      if (friends[id].status === 2) {
        returnIds.push(id);
      }
    });
    return returnIds;
  }

  reorderFunc(index) {
    function reorder(pageY) {
      let newIdx = 0;
      for (var idx = 0; idx < this.state.friendOrdering.length; idx++) {
        let friendId = this.state.friendOrdering[idx];
        if (!this.props.pluggedIn[friendId]) {
          continue;
        }
        let yCoor =
          this.layoutMap[friendId][0] + this.layoutMap[friendId][1] / 2;
        if (pageY + this.yOffset <= yCoor) {
          newIdx = idx;
          break;
        } else if (idx === this.state.friendOrdering.length - 1) {
          newIdx = this.state.friendOrdering.length;
        }
      }
      let arrayCopy = [];
      let currentIdx;
      this.state.friendOrdering.forEach((id, idx) => {
        arrayCopy.push(id);
        if (index === id) {
          currentIdx = idx;
        }
      });
      arrayCopy.splice(currentIdx, 1);
      if (currentIdx < newIdx) {
        arrayCopy.splice(newIdx - 1, 0, index);
      } else {
        arrayCopy.splice(newIdx, 0, index);
      }
      this.setState({friendOrdering: arrayCopy});
    }
    return reorder;
  }

  updateLayoutFunc(index) {
    function updateLayout(y, height) {
      this.layoutMap[index] = [y, height];
    }
    return updateLayout;
  }

  updateMoveMode(isInMoveMode) {
    this.setState({inMoveMode: isInMoveMode});
  }

  render() {
    return (
      <View
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#262626',
        }}>
        <ScrollView
          style={styles.scrollContainer}
          ref="container"
          onScroll={event => (this.yOffset = event.nativeEvent.contentOffset.y)}
          scrollEnabled={!this.state.inMoveMode}
          scrollEventThrottle={16}>
          <View style={styles.mainContainer}>
            {this.state.friendOrdering.map(key => {
              let friendDict = this.props.friends[key];
              if (!this.props.pluggedIn[key]) {
                return null;
              }

              return (
                <FriendCard
                  key={key}
                  id={key}
                  ownId={this.props.id}
                  videoOn={
                    this.props.streamStates[key] === StreamState.kStreaming
                  }
                  stream={this.props.streams[key]}
                  name={friendDict['name']}
                  picturePath={friendDict['profilePicturePath']}
                  status={friendDict['active'] ? friendDict['status'] : 2}
                  textStatus={friendDict['textStatus']}
                  myStatus={this.props.myStatus}
                  inCall={key in this.props.inCall}
                  isActive={friendDict['active']}
                  location={'Home'}
                  switchPage={this.props.switchPage}
                  switchSelfVideoState={this.props.switchSelfVideoState}
                  updateRecordingMessage={this.props.updateRecordingMessage}
                  reorder={this.reorderFunc(key).bind(this)}
                  updateLayout={this.updateLayoutFunc(key).bind(this)}
                  updateMoveMode={this.updateMoveMode.bind(this)}
                />
              );
            })}
          </View>
        </ScrollView>
      </View>
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
    backgroundColor: '#3b3b3b',
    paddingTop: 10,
    width: '100%',
    height: '100%',
  },
});
