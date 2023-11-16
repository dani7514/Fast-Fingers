import { initializeApp } from "firebase/app";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, User,Auth,signInWithPopup } from 'firebase/auth';

// const firebaseConfig = {
//     apiKey: "AIzaSyAK_jbicpRhXKeLRjlxYfhcNnmd3PN2buM",
//     authDomain: "fastfingers-f5a48.firebaseapp.com",
//     projectId: "fastfingers-f5a48",
//     storageBucket: "fastfingers-f5a48.appspot.com",
//     messagingSenderId: "62245487243",
//     appId: "1:62245487243:web:89b70606dde327c5be8a8e",
//     measurementId: "G-G5F1GLBXMN"
// };


const firebaseConfig = {
  apiKey: "AIzaSyBEa8dZX4HeWvO9yM-AUPqrDHeZQ22iU04",
  authDomain: "fast-fingers-aa025.firebaseapp.com",
  projectId: "fast-fingers-aa025",
  storageBucket: "fast-fingers-aa025.appspot.com",
  messagingSenderId: "1087993853078",
  appId: "1:1087993853078:web:fce4b2feaf2b9342803eb7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth: Auth = getAuth(app);


export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result: any = await signInWithPopup(auth, provider);


      if (result.additionalUserInfo?.isNewUser  && result.user) {
        const userRef = doc(db, 'users', result.user.uid);
        const userData = {
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        };
        await setDoc(userRef, userData, { merge: true });
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error.message);
    }
  };

  export const signOut = () => {
    auth.signOut();
  };
  
  export const onAuthStateChange = (callback: (user: User | null) => void) => {
    onAuthStateChanged(auth, callback);
  };
