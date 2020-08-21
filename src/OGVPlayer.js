import React from 'react';
import {requireNativeComponent, UIManager, findNodeHandle} from 'react-native';

class OGVPlayer extends React.Component {
  componentWillUnmount() {
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this),
      UIManager.getViewManagerConfig('RNTOGVPlayer').Commands.pause,
      [],
    );
  }

  render() {
    return <RNTOGVPlayer {...this.props} />;
  }
}

var RNTOGVPlayer = requireNativeComponent('RNTOGVPlayer', OGVPlayer);

export default OGVPlayer;
