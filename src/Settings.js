import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import {gestureIsClick, getSwipeDirection} from './utils';
import ProfilePicture from './ProfilePicture';
import TakeProfilePicture from './TakeProfilePicture';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export default class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      takingPicture: false,
      email: auth().currentUser.email ? auth().currentUser.email : "email@domain.com",
      password1: '',
      password2: '',
      friendEmail: 'e.g. friend@domain.com',
      successMessage: null,
      errorMessage: null,
      friendRequests: [],
    }
  }

  componentDidMount() {
    this.unsubscribe = firestore()
      .collection("friend-requests")
      .where("toId", "==", this.props.id)
      .onSnapshot(querySnapshot => {
        let friendRequests = [];
        querySnapshot.forEach(doc => {
          let request = {
            id: doc.id,
            email: doc.data().fromEmail,
            fromId: doc.data().fromId,
            name: doc.data().fromName,
            picturePath: doc.data().fromPicturePath,
          }
          friendRequests.push(request);
        });
        this.setState({friendRequests: friendRequests});
      })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  signOut() {
    auth().signOut().then(() => {
      this.props.updateUser(null);
    });
  }

  changeEmail(email) {
    auth().currentUser.updateEmail(email)
      .then(() => {
        this.setMessage(true, "Successfully changed email!")
      })
      .catch(err => {
        let errMessage = err.message.slice(err.message.indexOf(' ') + 1);
        this.setMessage(false, errMessage);
      })
  }

  changePassword(password1, password2) {
    if (password1 === password2) {
      auth().currentUser.updatePassword(password1)
        .then(() => {
          this.setMessage(true, "Successfully changed password!");
        })
        .catch(err => {
          let errMessage = err.message.slice(err.message.indexOf(' ') + 1);
          this.setMessage(false, errMessage);
        })
    } else {
      this.setMessage(false, "Passwords do not match.")
    }
  }

  sendFriendRequest(email) {
    firestore().collection("friend-requests").doc().set({
      "fromId": this.props.id,
      "toEmail": email
    }).then((temp) => {
      this.setMessage(true, "Successfully sent friend request");
    }).catch((err) => {
      console.log(err);
      this.setMessage(false, "Error sending friend request");
    });
  }

  acceptRequest(friendId) {
    firestore().collection("friend-requests").doc().set({
      "fromId": this.props.id,
      "toId": friendId
    });
  }

  rejectRequest(requestId) {
    firestore().collection("friend-requests").doc(requestId).delete();
  }

  uploadProfilePicture(uri) {
    let storagePath = `${this.props.id}/profile`;
    storage()
      .ref(storagePath)
      .putFile(uri)
      .then(taskSnapshot => {
        if (taskSnapshot.state === storage.TaskState.SUCCESS) {
          firestore().collection("users").doc(this.props.id).update({
            profilePicturePath: storagePath
          }).then((temp) => {
            this.setMessage(true, "Successfully updated profile picture.");
          });
        } else {
          this.setMessage(false, "Error uploading picture");
        }
      })
      .catch(err => {
        this.setMessage(false, "Error uploading picture");
      })
  }

  switchPictureScreen(isPicture) {
    this.setState({ takingPicture: isPicture });
  }
  
  friendRequest = function(requestData) {
    return (
      <View 
        key={requestData.id}
        style={{
          width: '80%',
          height: 60,
          marginTop: 5,
          marginBottom: 5,
          flexDirection: 'row',
          backgroundColor: '#595959',
          borderRadius: 75,
          alignItems: 'center',
        }}
      >
        <ProfilePicture
          picturePath={requestData.picturePath}
          name={requestData.name}
          size={60}
        />
        <View style={{
          height: 50,
          paddingLeft: 10,
        }}>
          <Text style={{
            color: 'white',
            marginTop: 5,
            fontWeight: 'bold'
          }}>
            {requestData.name}
          </Text>
          <Text style={{
            color: '#d4d4d4',
          }}>
            {requestData.email}
          </Text>
        </View>
        <View style={{
          flexDirection: 'row',
          position: 'absolute',
          right: 10
        }}>
          <TouchableOpacity onPress={() => this.acceptRequest(requestData.fromId)}>
            <Image
              source={require('./res/check.png')}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                marginRight: 10,
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => this.rejectRequest(requestData.id)}>
            <Image
              source={require('./res/redx.png')}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
              }}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  setMessage(isSuccess, message) {
    if (isSuccess) {
      this.setState({ successMessage: message });
    } else {
      this.setState({ errorMessage: message });
    }
    setTimeout(() => {
      this.setState({ successMessage: null, errorMessage: null });
    }, 4000);
  }

  currentMessage() {
    if (this.state.successMessage) {
      return (
        <View style={[styles.messageContainer, {backgroundColor: 'limegreen'}]}>
          <Text style={styles.messageText}>{this.state.successMessage}</Text>
        </View>
      );
    } else if (this.state.errorMessage) {
      return (
        <View style={[styles.messageContainer, {backgroundColor: 'red'}]}>
          <Text style={styles.messageText}>{this.state.errorMessage}</Text>
        </View>
      );
    } else {
      return null;
    }
  }

  render() {
    console.log(this.state.friendRequests);
    let line = (
      <View style={{
        width: '80%',
        height: 1,
        marginTop: 2,
        marginBottom: 2,
        backgroundColor: '#545454'
      }}>
      </View>
    );

    if (this.state.takingPicture) {
      return (
        <TakeProfilePicture
          uploadProfilePicture={this.uploadProfilePicture.bind(this)}
          switchPictureScreen={this.switchPictureScreen.bind(this)}
        />
      );
    } else {
      return (
        <>
          <ScrollView ref="container">
            <View style={styles.mainContainer}>
              <View style={styles.profilePicture}>
                <ProfilePicture
                  picturePath={this.props.myPicPath}
                  name={this.props.name}
                  size={150}
                />
                <TouchableOpacity
                  onPress={() => this.switchPictureScreen(true)}
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    right: -6,
                    width: 40,
                    height: 40,
                    borderRadius: 25,
                    backgroundColor: '#575757',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  <Image source={require('./res/camera-white.png')}
                    style={{
                      width: '80%',
                      height: '80%'
                    }}/>
                </TouchableOpacity>
              </View>

              <Text style={[styles.profileText, {marginBottom: 20}]}>
                {this.props.name}
              </Text>

              {line}

              <Text style={styles.menuText}>
                User Manual
              </Text>

              <Text style={styles.menuText}>
                Privacy, Security and your Data
              </Text>

              <Text style={styles.menuText}>
                About Siempre
              </Text>

              {line}

              <View
                style={{
                  borderBottomColor: 'gray',
                  borderBottomWidth: 1,
                }}
              />

              <Text style={styles.settingsText}>Email:</Text>
              <TextInput
                style={styles.textInput}
                onChangeText={(text) => this.setState({email: text})}
                value={this.state.email}
              />

              <View style={styles.contentButtonContainer}>
                <TouchableOpacity
                  style={[styles.settingsButton, styles.contentButton]}
                  onPress={() => this.changeEmail(this.state.email)}
                >
                  <Text style={{color: 'white'}}>Change Email</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsText}>New Password:</Text>
              <TextInput
                secureTextEntry={true}
                style={styles.textInput}
                onChangeText={(text) => this.setState({password1: text})}
                value={this.state.password1}
              />

              <Text style={styles.settingsText}>Confirm New Password:</Text>
              <TextInput
                secureTextEntry={true}
                style={styles.textInput}
                onChangeText={(text) => this.setState({password2: text})}
                value={this.state.password2}
              />

              <View style={styles.contentButtonContainer}>
                <TouchableOpacity
                  style={[styles.settingsButton, styles.contentButton]}
                  onPress={() => this.changePassword(this.state.password1, this.state.password2)}
                >
                  <Text style={{color: 'white'}}>Change Password</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsText}>Send friend request:</Text>
              <TextInput
                style={styles.textInput}
                onChangeText={(text) => this.setState({friendEmail: text})}
                value={this.state.friendEmail}
              />

              <View style={styles.contentButtonContainer}>
                <TouchableOpacity
                  style={[styles.settingsButton, styles.contentButton]}
                  onPress={() => this.sendFriendRequest(this.state.friendEmail)}
                >
                  <Text style={{color: 'white'}}>Send Friend Request</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsText}>Friend requests received:</Text>

              {
                this.state.friendRequests.length === 0 ?
                  (<View style={{
                    width: '80%',
                    height: 60,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{color: 'white'}}>No friend requests right now</Text> 
                  </View>)
                : this.state.friendRequests.map(friendRequest => (
                  this.friendRequest(friendRequest)
                ))
              }

              <View
                style={{
                  borderBottomColor: 'white',
                  borderBottomWidth: 1,
                }}
              />

              <TouchableOpacity
                style={[styles.settingsButton, {borderColor: 'red', marginTop: 20}]}
                onPress={this.signOut.bind(this)}
              >
                <Text style={{color: 'red'}}>Sign Out</Text>
              </TouchableOpacity>

              <Text style={{
                textAlign: 'center',
                width: '100%',
                paddingBottom: 8,
                paddingTop: 15,
                color: 'white'
              }}>
                2019 Siempre, Inc.
              </Text>
            </View>
          </ScrollView>
          { this.currentMessage() }
        </>
      );
    }
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingBottom: 30,
    width: '100%',
    height: '100%',
    backgroundColor: '#3b3b3b',
  },
  settingsText: {
    textAlign: 'left',
    width: '100%',
    marginLeft: 110,
    paddingBottom: 8,
    paddingTop: 15,
    color: 'white'
  },
  profileText: {
    fontSize: 20,
    color: 'white'
  },
  menuText: {
    color: 'white',
    marginTop: 5,
    marginBottom: 5
  },
  profilePicture: {
    width: 150,
    height: 150,
    marginBottom: 10
  },
  textInput: {
    width: '70%',
    height: 40,
    backgroundColor: '#595959',
    paddingLeft: 10,
    color: 'lightgray',
    marginBottom: 10,
  },
  settingsButton: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    marginBottom: 10 
  },
  contentButtonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  contentButton: {
    borderColor: 'white',
    marginLeft: 60,
  },
  messageContainer: {
    position:'absolute',
    bottom: 0,
    width: '100%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    color: 'white',
    fontSize: 16,
  }
});
