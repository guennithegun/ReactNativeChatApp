//import react component
import React, { Component } from 'react';
//import relevant components from react native
import { StyleSheet, Text, View, Platform, AsyncStorage, NetInfo } from 'react-native';
//import MapView
import MapView from 'react-native-maps';
// import gifted chat
import { GiftedChat, InputToolbar } from 'react-native-gifted-chat';
//import keyboardspacer
import KeyboardSpacer from 'react-native-keyboard-spacer';
//import custom CustomActions
import CustomActions from './CustomActions';
//import firebase
const firebase = require('firebase');
require('firebase/firestore');

// create Screen2 (Chat) class
export default class Chat extends Component {

  constructor() {
    super();

    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyBgLMM4wFJud3a596i1HtjhxOvwVfMfHEM",
        authDomain: "chatapp-2fd33.firebaseapp.com",
        databaseURL: "https://chatapp-2fd33.firebaseio.com",
        projectId: "chatapp-2fd33",
        storageBucket: "chatapp-2fd33.appspot.com",
        messagingSenderId: "15865766334",
        appId: "1:15865766334:web:e3fd5a58edf314a55c99ef"
      });
    }

    this.referenceChatMessages = firebase.firestore().collection('messages');

    this.state = {
      messages: [],
      uid: 0,
      isConnected: false,
      image: null
    };
  }

  // get messages from asyncStorage
  async getMessages() {
    let messages = '';
    try {
      messages = await AsyncStorage.getItem('messages') || [];
      this.setState({
        messages: JSON.parse(messages)
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  // save messages in asyncStorage
  async saveMessages() {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(this.state.messages));
    } catch (error) {
      console.log(error.message);
    }
  };

  // delete messages from asyncStorage
  async deleteMessages() {
    try {
      await AsyncStorage.removeItem('messages');
    } catch (error) {
      console.log(error.message);
    }
  }

  componentDidMount() {
    NetInfo.isConnected.addEventListener(
        'connectionChange',
        this.handleConnectivityChange
    );

    NetInfo.isConnected.fetch().then(isConnected => {
      if (isConnected) {
        this.setState({
          isConnected: true,
        });

        this.authUnsubscribe = firebase.auth().onAuthStateChanged((user) => {
          if (!user) {
            firebase.auth().signInAnonymously();
          }

          this.setState({
            uid: user.uid,
            messages: []
          });

          this.unsubscribe = this.referenceChatMessages.orderBy('createdAt', 'desc').onSnapshot(this.onCollectionUpdate);
        });
      } else {
        this.setState({
          isConnected: false,
        });

        this.getMessages();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
    this.authUnsubscribe();

    NetInfo.isConnected.removeEventListener(
        'connectionChange',
        this.handleConnectivityChange
    );
  };

  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      var data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text || '',
        createdAt: data.createdAt.toDate(),
        user: data.user,
        image: data.image || null,
        location: data.location || null,
      });
    });

    this.setState({
      messages,
    });
  };

  handleConnectivityChange = (isConnected) => {
    if(isConnected == true) {
      this.setState({
        isConnected: true
      });
      this.unsubscribe = this.referenceChatMessages.orderBy('createdAt', 'desc').onSnapshot(this.onCollectionUpdate);
    } else {
      this.setState({
        isConnected: false
      });
    }
  };

  addMessage() {
    const message = this.state.messages[0];
    this.referenceChatMessages.add({
      _id: message._id,
      text: message.text || '',
      createdAt: message.createdAt,
      user: message.user,
      image: message.image || null,
      location: message.location || null,
    });
  }
  //define title in navigation bar
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params.userName,
    };
  };

  //appending new message to messages object
  onSend(messages = []) {
    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }), () => {
      this.addMessage();
      this.saveMessages();
    });
  };

  // hide inputbar when offline
  renderInputToolbar(props) {
    if (this.state.isConnected == false) {
    } else {
      return(
        <InputToolbar
        {...props}
        />
      );
    }
  };

  //display the communication features
  renderCustomActions = (props) => {
    return <CustomActions {...props} />;
  };

  //custom map view
  renderCustomView (props) {
   const { currentMessage} = props;
   if (currentMessage.location) {
     return (
         <MapView
           style={{width: 150,
             height: 100,
             borderRadius: 13,
             margin: 3}}
           region={{
             latitude: currentMessage.location.latitude,
             longitude: currentMessage.location.longitude,
             latitudeDelta: 0.0922,
             longitudeDelta: 0.0421,
           }}
         />
     );
   }
   return null;
 }

  //render components
  render() {
    return (
      //fullscreen component
      <View style={{ flex:1, backgroundColor: this.props.navigation.state.params.backgroundColor }}>
        <GiftedChat
          messages={this.state.messages}
          renderInputToolbar={this.renderInputToolbar.bind(this)}
          renderActions={this.renderCustomActions}
          renderCustomView={this.renderCustomView}
          onSend={messages => this.onSend(messages)}
          user={{
            _id: this.state.uid
          }}
        />
        {Platform.OS === 'android' ? <KeyboardSpacer /> : null }
      </View>
    );
  }
};

const styles = StyleSheet.create({

});
