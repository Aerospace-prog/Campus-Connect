import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserRole } from '../types/models';
import { getFirebaseErrorMessage, logError, withRetry } from '../utils/error-handler';

/**
 * AuthService - Handles all authentication operations with Firebase
 */
export class AuthService {
  /**
   * Sign up a new user with email and password
   * Creates a user document in Firestore with user-selected role
   */
  static async signUp(
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<User> {
    try {
      // Create user in Firebase Authentication
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;

      // Create user document in Firestore with user-selected role
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        name,
        role,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Use retry for Firestore write operation
      await withRetry(
        () => setDoc(doc(db, 'users', firebaseUser.uid), userData),
        { operation: 'createUserDocument', userId: firebaseUser.uid }
      );

      return userData;
    } catch (error: any) {
      logError(error, { operation: 'signUp' });
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Sign in an existing user with email and password
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;

      // Fetch user data from Firestore with retry
      const userDoc = await withRetry(
        () => getDoc(doc(db, 'users', firebaseUser.uid)),
        { operation: 'getUserDocument', userId: firebaseUser.uid }
      );

      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      return userDoc.data() as User;
    } catch (error: any) {
      logError(error, { operation: 'signIn' });
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      logError(error, { operation: 'signOut' });
      throw new Error(getFirebaseErrorMessage(error));
    }
  }

  /**
   * Get the current authenticated user
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Get user data from Firestore
   */
  static async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await withRetry(
        () => getDoc(doc(db, 'users', uid)),
        { operation: 'getUserData', userId: uid }
      );

      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as User;
    } catch (error) {
      logError(error as Error, { operation: 'getUserData', userId: uid });
      return null;
    }
  }

  /**
   * Listen to authentication state changes
   * Returns an unsubscribe function
   */
  static onAuthStateChanged(
    callback: (user: User | null) => void
  ): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, fetch their data from Firestore
        const userData = await AuthService.getUserData(firebaseUser.uid);
        callback(userData);
      } else {
        // User is signed out
        callback(null);
      }
    });
  }
}
