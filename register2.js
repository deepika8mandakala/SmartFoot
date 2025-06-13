import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsN5MfK7DCeGiidFtcioriN3n6srA5yF0",
  authDomain: "smartroute-dec54.firebaseapp.com",
  projectId: "smartroute-dec54",
  storageBucket: "smartroute-dec54.appspot.com",
  messagingSenderId: "737757522088",
  appId: "1:737757522088:web:b5fff35603a614a1b5fa9d",
  measurementId: "G-W5D0Z6SBW0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Debugging: Check Firebase initialization
console.log("Firebase initialized:", app.name);

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded");
  
  const registerBtn = document.getElementById('submit');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  
  if (registerBtn && emailInput && passwordInput) {
    console.log("All elements found");
    
    registerBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      
      console.log("Attempting registration with:", email);

      // Basic validation
      if (!email || !password) {
        alert("Please fill in all fields");
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Registration success:", userCredential.user);
        alert('Registration successful!');
        window.location.href = '/nextpage.html';
      } catch (error) {
        console.error("Registration error:", error);
        
        // User-friendly error messages
        let errorMessage = "Registration failed: ";
        switch(error.code) {
          case 'auth/email-already-in-use':
            errorMessage += "This email is already registered";
            break;
          case 'auth/invalid-email':
            errorMessage += "Invalid email format";
            break;
          case 'auth/weak-password':
            errorMessage += "Password should be at least 6 characters";
            break;
          case 'auth/operation-not-allowed':
            errorMessage += "Email/password accounts are not enabled";
            break;
          default:
            errorMessage += error.message;
        }
        
        alert(errorMessage);
      }
    });
  } else {
    console.error("Missing elements:", {
      registerBtn: !!registerBtn,
      emailInput: !!emailInput,
      passwordInput: !!passwordInput
    });
  }
});

// Auth state observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user.email, user.uid);
  } else {
    console.log("No user signed in");
  }
});