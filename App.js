import React from 'react';
import { AppRegistry } from 'react-native';

import Login from './src/Login';
import Main from './src/Main';

export default class App extends React.Component {
  state = { uid: null }

  updateUser(user) {
    if (user === null && this.state.uid) {
      this.setState({ uid: null });
    } else if (user) {
      this.setState({ uid: user.uid });
    }
  }

  render() {
    console.log('App.js props: ', this.props);
    if (this.state.uid) {
      return (
        <Main id={this.state.uid} updateUser={this.updateUser.bind(this)}/>
      );
    } else {
      return (
        <Login updateUser={this.updateUser.bind(this)}/>
      );
    }
  }
};
