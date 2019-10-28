/**
* @description this is the chatscreen, where the user can write and sent
* messages, images or geo-location
* @class Chat
* @requires React
* @requires React-Native
* @requires Keyboard-Spacer
* @requires React-Native-Gifted-Chat
* @requires CustomActions
* @requires React-Native-Maps
* @requires Firebase
* @requires Firestore
*/

//  import react component
import React, { Component } from 'react';
//  import relevant components from react native
import {
  StyleSheet, View, Platform, AsyncStorage, NetInfo,
} from 'react-native';
//  import MapView
import MapView from 'react-native-maps';
//  import gifted chat
import { GiftedChat, InputToolbar } from 'react-native-gifted-chat';
//  import keyboardspacer
import KeyboardSpacer from 'react-native-keyboard-spacer';
//  import custom CustomActions
import CustomActions from './CustomActions';
//  import firebase
const firebase = require('firebase');
require('firebase/firestore');

//  create Screen2 (Chat) class
export default class Chat extends Component {
  //  define title in navigation bar
  static navigationOptions = ({ navigation }) => ({ title: `${navigation.state.params.userName}'s Chat` });

  constructor() {
    super();

    /**
    * initializing firebase
    * @param {object} firebaseConfig
    * @param {string} apiKey
    * @param {string} authDomain
    * @param {string} databaseURL
    * @param {string} projectID
    * @param {string} storageBucket
    * @param {string} messagingSenderId
    * @param {string} appId
    */
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: 'AIzaSyBgLMM4wFJud3a596i1HtjhxOvwVfMfHEM',
        authDomain: 'chatapp-2fd33.firebaseapp.com',
        databaseURL: 'https://chatapp-2fd33.firebaseio.com',
        projectId: 'chatapp-2fd33',
        storageBucket: 'chatapp-2fd33.appspot.com',
        messagingSenderId: '15865766334',
        appId: '1:15865766334:web:e3fd5a58edf314a55c99ef',
      });
    }

    this.referenceChatMessages = firebase.firestore().collection('messages');

    this.state = {
      messages: [],
      uid: 0,
      isConnected: false,
      image: null,
    };
  }

  componentDidMount() {
    NetInfo.isConnected.addEventListener(
      'connectionChange',
      this.handleConnectivityChange,
    );

    NetInfo.isConnected.fetch().then((isConnected) => {
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
            messages: [],
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
      this.handleConnectivityChange,
    );
  }

  /**
  * loads all messages from AsyncStorage
  * @function getMessages
  * @async
  * @return {Promise<string>} The data from the storage
  */
  getMessages = async () => {
    let messages = '';
    try {
      messages = await AsyncStorage.getItem('messages') || [];
      this.setState({
        messages: JSON.parse(messages),
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  /**
  * saves all messages from AsyncStorage
  * @function saveMessages
  * @async
  */
  saveMessages = async () => {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(this.state.messages));
    } catch (error) {
      console.log(error.message);
    }
  };

  /**
  * deletes all messages from AsyncStorage
  * @function deleteMessages
  * @async
  */
  deleteMessages = async () => {
    try {
      await AsyncStorage.removeItem('messages');
    } catch (error) {
      console.log(error.message);
    }
  };

  /**
  * onCollectionUpdte takes snapshot on collection update
  * @function onCollectionUpdate
  * @param {string} _id
  * @param {string} text
  * @param {number} created.At
  * @param {object} user
  * @param {string} user._id
  * @param {string} image
  * @param {object} location
  * @param {number} location.longitude
  * @param {number} location.latitude
  */
  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      const data = doc.data();
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

  /**
  * checks networkstatus of user
  * @function handleConnectivityChange
  */
  handleConnectivityChange = (isConnected) => {
    if (isConnected === true) {
      this.setState({
        isConnected: true,
      });
      this.unsubscribe = this.referenceChatMessages.orderBy('createdAt', 'desc').onSnapshot(this.onCollectionUpdate);
    } else {
      this.setState({
        isConnected: false,
      });
    }
  };

  /**
  * adds the message object to firestore, fired by onSend function
  * @function addMessage
  * @param {string} _id
  * @param {string} text
  * @param {number} created.At
  * @param {object} user
  * @param {string} user._id
  * @param {string} image
  * @param {object} location
  * @param {number} location.longitude
  * @param {number} location.latitude
  */
  addMessage = () => {
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

  /**
  * handles actions when user hits send-button
  * @function onSend
  * @param {object} messages
  */
  onSend = (messages = []) => {
    this.setState((previousState) => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }), () => {
      this.addMessage();
      this.saveMessages();
    });
  };

  /**
  * hides inputbar when offline
  * @function renderInputToolbar
  */
  renderInputToolbar = (props) => {
    if (this.state.isConnected == false) {
    } else {
      return (
        <InputToolbar
        {...props}
        />
      );
    }
  };

  /**
  * displays the communication features
  * @function renderCustomActions
  */
  renderCustomActions = (props) => <CustomActions {...props} />;

  //  custom map view
  renderCustomView(props) {
    const { currentMessage } = props;
    if (currentMessage.location) {
      return (
        <MapView
          style={{
            width: 150,
            height: 100,
            borderRadius: 13,
            margin: 3,
          }}
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

  //  render components
  render() {
    return (
      //  fullscreen component
      <View
        style={{
          flex: 1,
          backgroundColor: this.props.navigation.state.params.backgroundColor,
        }}
      >
        <GiftedChat
          messages={this.state.messages}
          renderInputToolbar={this.renderInputToolbar}
          renderActions={this.renderCustomActions}
          renderCustomView={this.renderCustomView}
          onSend={(messages) => this.onSend(messages)}
          user={{
            _id: this.state.uid
          }}
        />
        {Platform.OS === 'android' ? <KeyboardSpacer /> : null }
      </View>
    );
  }
}
