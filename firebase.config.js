import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCJEIVXb0FeJlnaRkVmIK73TtrYPDdrrpU",
  authDomain: "cyber-33397.firebaseapp.com",
  projectId: "cyber-33397",
  storageBucket: "cyber-33397.appspot.com",
  messagingSenderId: "713937954692",
  appId: "1:713937954692:web:9711e55ba7c6091cd81fd1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export default app;