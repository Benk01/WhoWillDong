// Import the functions you need from the SDKs you need
import firebase from 'firebase/app';
import 'firebase/functions'; // If you need to use Cloud Functions
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBRwIDCqslaCXlD7UXwTDSQAgCx125XqOw",
    authDomain: "will-it-dong.firebaseapp.com",
    projectId: "will-it-dong",
    storageBucket: "will-it-dong.appspot.com",
    messagingSenderId: "190947605872",
    appId: "1:190947605872:web:8e1ef2fe4f90a7a7cce3b5",
    measurementId: "G-2SG7Z3V0L3"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // if already initialized, use that one
}

export default firebase;