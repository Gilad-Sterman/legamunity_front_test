// CLEANUP: Firebase Authentication Service commented out - using Supabase instead
// TODO: Safe to delete after confirming no dependencies

/*
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Firebase Authentication Service
 * Provides methods for authentication operations
 */

// Register a new user
export const registerUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user profile with display name
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    // Send email verification
    await sendEmailVerification(userCredential.user);
    
    // Get the ID token
    const token = await userCredential.user.getIdToken();
    
    return {
      user: {
        id: userCredential.user.uid,
        name: userCredential.user.displayName || '',
        email: userCredential.user.email,
        emailVerified: userCredential.user.emailVerified,
        role: 'user' // Default role, can be updated based on custom claims
      },
      token
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Login with email and password
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Get the ID token
    const token = await userCredential.user.getIdToken();
    
    // Get user role from custom claims (if implemented)
    // This would require Firebase Functions to set custom claims
    // For now, we'll use a simple approach
    const role = email.includes('admin') ? 'admin' : 'user';
    
    return {
      user: {
        id: userCredential.user.uid,
        name: userCredential.user.displayName || '',
        email: userCredential.user.email,
        emailVerified: userCredential.user.emailVerified,
        role
      },
      token
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Get current user
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      
      if (user) {
        // User is signed in
        try {
          // Get the ID token
          const token = await user.getIdToken();
          
          // Get user role from custom claims (if implemented)
          // For now, we'll use a simple approach
          const role = user.email.includes('admin') ? 'admin' : 'user';
          
          resolve({
            user: {
              id: user.uid,
              name: user.displayName || '',
              email: user.email,
              emailVerified: user.emailVerified,
              role
            },
            token
          });
        } catch (error) {
          reject(error);
        }
      } else {
        // User is signed out
        resolve(null);
      }
    }, reject);
  });
};

// Send password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    throw new Error(error.message);
  }
};

// Verify token (not directly needed with Firebase, but kept for compatibility)
export const verifyToken = async () => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No authenticated user');
    }
    
    // Force token refresh
    await currentUser.getIdToken(true);
    
    // Get user role from custom claims (if implemented)
    // For now, we'll use a simple approach
    const role = currentUser.email.includes('admin') ? 'admin' : 'user';
    
    return {
      id: currentUser.uid,
      name: currentUser.displayName || '',
      email: currentUser.email,
      emailVerified: currentUser.emailVerified,
      role
    };
  } catch (error) {
    throw new Error(error.message);
  }
};


// CLEANUP NOTE: Firebase auth service completely disabled
// All exports removed to prevent conflicts
// Any remaining imports of this service should be updated to use Supabase auth instead
