import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Thêm Firebase Storage

const firebaseConfig = {
    apiKey: 'AIzaSyCDoswUUq5SZF2CBy_ULzihnsH43IhYmuw',
    authDomain: 'huit-e-learn.firebaseapp.com',
    projectId: 'huit-e-learn',
    storageBucket: 'huit-e-learn.firebasestorage.app',
    messagingSenderId: '261202570231',
    appId: '1:261202570231:web:1720c0e1277766f5c45cf2',
    measurementId: 'G-EZ10XR95Z7',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app); // Khởi tạo Firebase Storage

export { app, auth, googleProvider, facebookProvider, db, storage };
