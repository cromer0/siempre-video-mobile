import React from 'react';
import { Text, View, Image, StyleSheet } from 'react-native';

export default class TopBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {

    let highlightedRegion;
    if(this.props.currentPage == 0){
      highlightedRegion = (<View style={{
        position: 'absolute',
        top: 0,
        left: 20,
        width: 90,
        height: '100%',
        backgroundColor: '#383838'
      }}/>)
    }
    if(this.props.currentPage == 1){
      highlightedRegion = (<View style={{
        position: 'absolute',
        top: 0,
        left: 110,
        width: 85,
        height: '100%',
        backgroundColor: '#383838'
      }}/>)
    }
    if(this.props.currentPage == 2){
      highlightedRegion = (<View style={{
        position: 'absolute',
        top: 0,
        left: 205,
        width: 90,
        height: '100%',
        backgroundColor: '#383838'
      }}/>)
    }
    if(this.props.currentPage == 3){
      highlightedRegion = (<View style={{
        position: 'absolute',
        top: 0,
        left: 300,
        width: 90,
        height: '100%',
        backgroundColor: '#383838'
      }}/>)
    }

    return (
      <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 60,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#262626',
          flexDirection: 'row'
        }}>
        {highlightedRegion}
        <Image source={require('./res/gear-white.png')} 
            style={[styles.barIcon,{
              width: 30,
              height: 30
            }
        ]}/>
        <Image source={require('./res/settings-white.png')} 
            style={[styles.barIcon,{
              width: 40,
              height: 40
            }
        ]}/>
        <Image source={require('./res/siempre-white.png')} 
            style={[styles.barIcon,{
              width: 50,
              height: 50
            }
        ]}/>
        <Image source={require('./res/private-white.png')} 
            style={[styles.barIcon,{
              width: 35,
              height: 35
            }
        ]}/>      
      </View>
    );
  }
}

const styles = StyleSheet.create({
  barIcon: {
    marginTop: 5,
    marginLeft: 26,
    marginRight: 26
  },
});
