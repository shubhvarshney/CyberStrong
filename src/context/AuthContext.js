import * as React from 'react';
const { createContext, useContext, useEffect, useState } = React;
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../../firebase.config';
import { UserDataService } from '../services/UserDataService';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Handles all Firebase Auth and Google authentication details

WebBrowser.maybeCompleteAuthSession();
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const WEB_CLIENT_ID = '527698079214-cg1quomar40gbfg34j04nhcus73jd5l0.apps.googleusercontent.com';
  const IOS_CLIENT_ID = '527698079214-34b4v6eu4sn7mgusvul7ll4h2uaaqb65.apps.googleusercontent.com';
 
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: Platform.select({ web: false, default: true }),
  });

  console.log('Google Auth redirectUri:', redirectUri);
  console.log('Google Auth client IDs:', {
    expoClientId: WEB_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: '',
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    redirectUri,
    responseType: 'id_token',
  });

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  let cancelTimeout = null;
  const googleSignIn = async () => {
    try {
      const result = await promptAsync({
        useProxy: Platform.select({ web: false, default: true }),
        windowOpener: true,
      });

      if (result?.type === 'success' && result?.authentication?.idToken) {
        if (cancelTimeout) {
          clearTimeout(cancelTimeout);
          cancelTimeout = null;
        }
        const credential = GoogleAuthProvider.credential(result.authentication.idToken);
        return signInWithCredential(auth, credential);
      } else if (result?.type === 'error') {
        throw new Error(result.error || 'Google Sign-In failed');
      } else {
        await new Promise((resolve, reject) => {
          cancelTimeout = setTimeout(() => {
            cancelTimeout = null;
            if (!auth.currentUser) {
              reject(new Error('Google Sign-In was cancelled'));
            } else {
              resolve(); 
            }
          }, 500);
        });
      }
    } catch (error) {
      throw new Error(error.message || 'An unexpected error occurred during Google Sign-In');
    }
  }

  const logout = () => {
    console.log('AuthContext: logout called');
    console.log('AuthContext: current auth state before logout:', auth.currentUser?.email);
    return signOut(auth).then(() => {
      console.log('AuthContext: signOut successful');
      console.log('AuthContext: current auth state after logout:', auth.currentUser?.email);
      setCurrentUser(null);
    }).catch((error) => {
      console.error('AuthContext: signOut error:', error);
      throw error;
    });
  }
  
  useEffect(() => {
    console.log('Google OAuth response:', response);
    if (!response) return;
    if (response?.type === 'success') {
      let idToken = null;

      if (response?.authentication?.idToken) {
        idToken = response.authentication.idToken;
      } else if (response?.params?.id_token) {
        idToken = response.params.id_token;
      }

      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        signInWithCredential(auth, credential)
          .then((userCred) => {
            console.log('Firebase signInWithCredential success:', userCred);
          })
          .catch((err) => {
            console.error('Firebase signInWithCredential error:', err);
          });
      } else {
        console.error('No id_token found in Google OAuth response:', response);
      }
      return; 
    }

    if (response?.type && response?.type !== 'success') {
      console.warn('Google OAuth response not successful:', response);
    }
  }, [response]);

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthContext: Auth state changed, user:', user ? user.email : 'null');
      console.log('AuthContext: Auth state changed, uid:', user ? user.uid : 'null');
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await UserDataService.initializeUserProfile(user.uid, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          });
          setUserProfile(profile);
          console.log('User profile loaded:', profile);
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshUserProfile = async () => {
    if (currentUser) {
      try {
        const profile = await UserDataService.getUserProfile(currentUser.uid);
        setUserProfile(profile);
        return profile;
      } catch (error) {
        console.error('Error refreshing user profile:', error);
        return null;
      }
    }
    return null;
  };

  const value = {
    currentUser,
    userProfile,
    refreshUserProfile,
    signup,
    login,
    googleSignIn,
    logout,
    loading,
    googleAuthRequest: request,
    googlePromptAsync: promptAsync,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
