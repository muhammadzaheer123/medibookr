import React from 'react';
import {View,Text,Image,StyleSheet,TouchableOpacity,Dimensions,ToastAndroid,ActivityIndicator,ToolbarAndroidBase} from 'react-native';
import {RNCamera} from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob';
import storage from '@react-native-firebase/storage';
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import NetInfo from "@react-native-community/netinfo";

const FireBaseStorage = storage();

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      flash: 'off',
      zoom: 0,
      autoFocus: 'on',
      autoFocusPoint: {
        normalized: {x: 0.5,y: 0.5},
        drawRectPosition: {
          x: Dimensions.get('window').width * 0.5 - 32,
          y: Dimensions.get('window').height * 0.5 - 32,
        },
      },
      depth: 0,
      type: 'back',
      whiteBalance: 'auto',
      ratio: '16:9',
      recordOptions: {
        mute: false,

        quality: RNCamera.Constants.VideoQuality['288p'],
      },
      isRecording: false,
      canDetectFaces: false,
      canDetectText: false,
      canDetectBarcode: false,
      faces: [],
      textBlocks: [],
      barcodes: [],
      final: false,
      data: '',
      loader: false,
      loading: true,
      isConnected: ''
    };

  };

  componentDidMount() {
    NetInfo.addEventListener(state => {
      // console.log("Connection type", state.type);
      this.setState({isConnected: state.isConnected});
      this.handleConnectivityChange()
    });

  }

  handleConnectivityChange = () => {

    if (this.state.isConnected) {
      this.setState({loading: true});
      //Intializing firebase
      if (!firebase.apps.length) {
        firebase.initializeApp({
          apiKey: "AIzaSyDWcTtHdP3beYCcoKznak4wg1c_jyhc_dw",
          authDomain: "medibookr-4c6f5.firebaseapp.com",
          databaseURL: "https://medibookr-4c6f5.firebaseio.com",
          projectId: "medibookr-4c6f5",
          storageBucket: "medibookr-4c6f5.appspot.com",
          messagingSenderId: "172496410590",
          appId: "1:172496410590:web:510e5560a77a1b62186f4f",
          measurementId: "G-ZY6ZG61Y68"
        })
      };
      auth().signInAnonymously()
    } else {
      ToastAndroid.show('Intenet is not Connected',ToastAndroid.SHORT)
      this.setState({loading: false});
    }
  };

  callMe = async () => {
    //using RNFetchlob for uploading video to firebase and converting it into base64
    const sessionId = new Date().getTime();
    const Blob = RNFetchBlob.polyfill.Blob;
    const fs = RNFetchBlob.fs;
    window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest;
    window.Blob = Blob;
    let uploadBlob = null;
    let mime = 'video/mp4';
    this.setState({loader: true})
    try {
      const storageRef = await FireBaseStorage.ref(`video${sessionId}`);
      return fs.readFile(this.state.data,'base64')
        .then((data) => {
          return Blob.build(data,{type: `${mime};BASE64`})
        })
        .then((blob) => {
          // console.log('..............',blob._ref)
          uploadBlob = blob;
          return storageRef.putFile(blob._ref,{contentType: mime})
        })
        .then((res) => {
          //  console.log("res",res)
          uploadBlob.close();
          return storageRef.getDownloadURL()
        })
        .then((res) => {
          // console.log("URL",res);


        }).then(() => {
          this.setState({loader: false,isRecording: false,final: false})
          ToastAndroid.show('Video has been uploaded to Firebase',ToastAndroid.show);
          this.camera = false;

        })

    }
    catch{
      ToastAndroid.show('Something Went Wrong',ToastAndroid.show);

    }

  }
  takeVideo = async () => {
    const {isRecording} = this.state;
    this.setState({isRecording: true})
    if (this.camera && isRecording) {
      try {
        const promise = this.camera.recordAsync(this.state.recordOptions);

        if (promise) {

          this.setState({final: true})

          const data = await promise;
          this.setState({isRecording: true,data: data.uri});

          this.callMe();
          // console.warn('takeVideo',data);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };
  stopVideo = () => {
    if (this.camera) {


      this.camera.stopRecording();
    }
  }
  render() {
    return (
      <View style={{flexDirection: 'column',flex: 1}}>
        <View style={styles.topContainer}>
          <Text style={{marginLeft: 10}}>MEDIBOOKR DASHBOARD</Text>
        </View>
        {!this.state.loading ? <View style={styles.mainContainer}><Text style={{color: 'red',fontWeight: 'bold'}}>Internet is not Connected</Text></View>
          :
          <View style={styles.mainContainer}>
            <View style={styles.imageContainer}>
              <Image style={styles.imageStyle} source={require('./logo.png')} resizeMode="cover" />
            </View>
            <View style={styles.buttonContainer}>
              {!this.state.isRecording ? <TouchableOpacity onPress={() => this.takeVideo()} style={styles.buttonStyle} >
                <Text>CALL</Text>

              </TouchableOpacity> : !this.state.final ? <TouchableOpacity onPress={() => this.takeVideo()} style={styles.buttonStyle} >
                <Text>RECORD VIDEO</Text>

              </TouchableOpacity> : <TouchableOpacity disabled={true} onPress={() => this.takeVideo()} style={styles.recordinStartButton} >
                    <Text>RECORDING START</Text>

                  </TouchableOpacity>}


              <TouchableOpacity onPress={() => {this.setState({isRecording: false});; this.stopVideo()}} style={styles.buttonStyle} >
                <Text>SAVE</Text>

              </TouchableOpacity>


            </View>
            <View style={styles.videoContainer}>
              {!this.state.loader ?
                this.state.isRecording ? <RNCamera
                  ref={(ref) => {

                    this.camera = ref;
                  }}
                  style={{flex: 1,width: '100%',overflow: 'hidden'}}
                  type={RNCamera.Constants.Type.back}
                  flashMode={RNCamera.Constants.FlashMode.off}
                  androidCameraPermissionOptions={{
                    title: 'Permission to use camera',
                    message: 'We need your permission to use your camera',
                    buttonPositive: 'Ok',
                    buttonNegative: 'Cancel',
                  }}
                  androidRecordAudioPermissionOptions={{
                    title: 'Permission to use audio recording',
                    message: 'We need your permission to use your audio',
                    buttonPositive: 'Ok',
                    buttonNegative: 'Cancel',
                  }}
                  onGoogleVisionBarcodesDetected={({barcodes}) => {
                    console.log(barcodes);
                  }}
                /> : <View style={styles.videoContainer}><Text>INITIALIZE VIDEO HERE</Text></View> : <ActivityIndicator size="large" color='green' />}

            </View>


          </View>}
        <View style={styles.lastButtons}>
          <View style={styles.insideLastButton}>
            <TouchableOpacity style={styles.lastButton}>
              <Text>Home</Text>

            </TouchableOpacity>
            <TouchableOpacity style={styles.lastButton}>
              <Text>Users</Text>

            </TouchableOpacity>
            <TouchableOpacity style={styles.lastButton}>
              <Text style={{alignSelf: 'center'}}>Messages</Text>

            </TouchableOpacity>
          </View>

        </View>


      </View>

    )
  }
}
const styles = StyleSheet.create({
  topContainer: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    backgroundColor: '#6dd8ed',
    flex: .1
  },
  mainContainer: {
    marginLeft: 10,
    marginRight: 10,
    marginTop: 20,
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: '#cecece',
    height: 150,
    borderColor: '#dedede',
    flex: 0.3,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  imageStyle: {
    width: '100%',
    height: 150
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 0.3,
    alignItems: 'center'

  },
  buttonStyle: {
    height: 40,
    width: 130,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4bccac',
    borderRadius: 10

  },
  recordinStartButton: {
    height: 40,
    width: 130,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'grey',
    borderRadius: 10

  },
  videoContainer: {
    flex: 0.7,
    backgroundColor: '#cecece',
    justifyContent: 'center',
    alignItems: 'center'

  },
  lastButtons: {
    flex: 0.1,
    backgroundColor: '#fefefe',
    justifyContent: 'center',
    marginTop: 10

  },
  insideLastButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 20,
    marginRight: 20,
  },
  lastButton: {

    justifyContent: 'center',
    alignItems: 'center'
  },
  preview: {







  },



})