// registration.js
import { auth, provider } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
  const signupBtn = document.getElementById('signup');
  const googleSignupBtn = document.getElementById('google-signup');  // Make sure this button exists in your HTML

  // Email/Password Sign Up
  if (signupBtn) {
    signupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!email || !password) {
        alert('Please enter both email and password');
        return;
      }
      if (password.length < 6) {
        alert('Password should be at least 6 characters');
        return;
      }

      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          alert('Sign up successful! Welcome ' + userCredential.user.email);
          window.location.href = 'home.html';
        })
        .catch((error) => {
          let errorMessage = 'Sign up failed: ';
          switch (error.code) {
            case 'auth/email-already-in-use':
              errorMessage += 'Email already in use';
              break;
            case 'auth/invalid-email':
              errorMessage += 'Invalid email format';
              break;
            case 'auth/weak-password':
              errorMessage += 'Weak password, try a stronger one';
              break;
            default:
              errorMessage += error.message;
          }
          alert(errorMessage);
        });
    });
  }

  // Google Sign-Up (using signInWithPopup, same as sign-in with Google)
  if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      signInWithPopup(auth, provider)
        .then((result) => {
          const user = result.user;
          alert(`Welcome ${user.displayName || user.email}!`);
          window.location.href = 'home.html';
        })
        .catch((error) => {
          if (error.code === 'auth/popup-closed-by-user') {
            alert('Google sign-in was cancelled');
          } else {
            alert('Google sign-in failed: ' + error.message);
          }
        });
    });
  }
});
