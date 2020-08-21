import React from 'react';
import {Text, TextInput, View, Button, Image, StyleSheet} from 'react-native';

import auth from '@react-native-firebase/auth';

export default class Login extends React.Component {
  state = {
    email: '',
    password: '',
  };

  componentDidMount() {
    this.subscriber = auth().onAuthStateChanged(this.props.updateUser);
  }

  componentWillUnmount() {
    this.subscriber();
  }

  handleChangeEmail(text) {
    this.setState({email: text});
  }

  handleChangePassword(text) {
    this.setState({password: text});
  }

  handleLoginPress() {
    auth().signInWithEmailAndPassword(this.state.email, this.state.password);
  }

  render() {
    return (
      <>
        <View style={styles.containerView}>
          <View
            style={{
              flexDirection: 'row',
            }}>
            <Image
              source={require('./res/siempre-black.png')}
              style={[
                styles.barIcon,
                {
                  width: 44,
                  height: 44,
                },
              ]}
            />
            <Text style={styles.titleText}>SIEMPRE</Text>
          </View>
          <Text style={styles.mottoText}>humans deserve better</Text>
          <TextInput
            style={styles.textInput}
            onChangeText={this.handleChangeEmail.bind(this)}
            defaultValue={'Email'}
          />
          <TextInput
            secureTextEntry={true}
            style={styles.textInput}
            onChangeText={this.handleChangePassword.bind(this)}
            defaultValue={'Password'}
          />
          <Button
            title={'Login'}
            onPress={this.handleLoginPress.bind(this)}
            color="gray"
          />
        </View>
      </>
    );
  }
}

const styles = StyleSheet.create({
  containerView: {
    paddingTop: '40%',
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#cbcbcb',
  },
  titleText: {
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 3,
    marginRight: 10,
  },
  mottoText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  textInput: {
    width: '70%',
    height: 40,
    backgroundColor: 'white',
    marginBottom: 15,
    borderRadius: 5
  },
});
