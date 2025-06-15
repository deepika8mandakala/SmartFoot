import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsN5MfK7DCeGiidFtcioriN3n6srA5yF0",
  authDomain: "smartroute-dec54.firebaseapp.com",
  projectId: "smartroute-dec54",
  storageBucket: "smartroute-dec54.firebasestorage.app",
  messagingSenderId: "737757522088",
  appId: "1:737757522088:web:b5fff35603a614a1b5fa9d",
  measurementId: "G-W5D0Z6SBW0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

document.addEventListener('DOMContentLoaded', () => {
  // Email/Password Login
  const loginBtn = document.getElementById('submit');
  const googleSigninBtn = document.getElementById('google-signin');
  
  // Email/Password Login Handler
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!email || !password) {
        alert('Please enter both email and password');
        return;
      }

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          alert('Logged in successfully');
          window.location.href = 'home.html';
        })
        .catch((error) => {
          let errorMessage = 'Login failed: ';
          switch(error.code) {
            case 'auth/invalid-email':
              errorMessage += 'Invalid email format';
              break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
              errorMessage += 'Invalid email or password';
              break;
            default:
              errorMessage += error.message;
          }
          alert(errorMessage);
        });
    });
  }

  // Google Sign-In Handler
  if (googleSigninBtn) {
    googleSigninBtn.addEventListener('click', (e) => {
      e.preventDefault();
      signInWithPopup(auth, provider)
        .then((result) => {
          const user = result.user;
          alert(`Welcome ${user.displayName || user.email}!`);
          window.location.href = 'home.html';
        })
        .catch((error) => {
          console.error("Google Sign-In Error:", error);
          if (error.code === 'auth/popup-closed-by-user') {
            alert('Google sign-in was cancelled');
          } else {
            alert('Google sign-in failed: ' + error.message);
          }
        });
    });
  }
});

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user.email);
    // You could redirect logged-in users here if needed
  } else {
    console.log("No user signed in");
  }
});