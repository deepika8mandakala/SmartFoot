import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCsN5MfK7DCeGiidFtcioriN3n6srA5yF0",
  authDomain: "smartroute-dec54.firebaseapp.com",
  projectId: "smartroute-dec54",
  storageBucket: "smartroute-dec54.appspot.com", // ✅ Corrected here
  messagingSenderId: "737757522088",
  appId: "1:737757522088:web:b5fff35603a614a1b5fa9d",
  measurementId: "G-W5D0Z6SBW0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM ready for sign-in");

  const loginBtn = document.getElementById('login');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  if (loginBtn && emailInput && passwordInput) {
    loginBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      console.log("Attempting login with:", email);

      if (!email || !password) {
        alert("Please enter both email and password");
        return;
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Login success:", userCredential.user);
        alert('Login successful!');
        window.location.href = '/nextpage.html'; // ✅ redirect after login
      } catch (error) {
        console.error("Login error:", error);

        let errorMessage = "Login failed: ";
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage += "No user found with this email";
            break;
          case 'auth/wrong-password':
            errorMessage += "Incorrect password";
            break;
          case 'auth/invalid-email':
            errorMessage += "Invalid email format";
            break;
          default:
            errorMessage += error.message;
        }

        alert(errorMessage);
      }
    });
  } else {
    console.error("Missing login elements:", {
      loginBtn: !!loginBtn,
      emailInput: !!emailInput,
      passwordInput: !!passwordInput
    });
  }
});

// ✅ Auth observer (optional)
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user.email);
  } else {
    console.log("User is signed out");
  }
});
