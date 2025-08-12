import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
const firebaseConfig = {
  apiKey: "AIzaSyARgr3xiOEQ1Dznue9HTTEJR5RTLmTFQos",
  authDomain: "learning-firebase-39d50.firebaseapp.com",
  projectId: "learning-firebase-39d50",
  storageBucket: "learning-firebase-39d50.firebasestorage.app",
  messagingSenderId: "922354948167",
  appId: "1:922354948167:web:ea210e9f968e05a63eb962",
  measurementId: "G-9H2CRDES5X",
};

const formTitle = document.getElementById("formTitle");
const confirmPasswordGroup = document.getElementById("confirmPasswordGroup");
const switchForm = document.getElementById("switchForm");
const mainBtn = document.getElementById("mainBtn");
let isLogin = true;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

switchForm.addEventListener("click", () => {
  isLogin = !isLogin;
  if (isLogin) {
    formTitle.textContent = "Login";
    confirmPasswordGroup.style.display = "none";
    mainBtn.textContent = "Login";
    switchForm.innerHTML = "Don't have an account? <span>Sign Up</span>";
  } else {
    formTitle.textContent = "Sign Up";
    confirmPasswordGroup.style.display = "block";
    mainBtn.textContent = "Sign Up";
    switchForm.innerHTML = "Already have an account? <span>Login</span>";
  }
});
function togglePassword(btn) {
  const input = btn.previousElementSibling;
  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "Hide";
  } else {
    input.type = "password";
    btn.textContent = "Show";
  }
}
function showError(message) {
  const errorBox = document.getElementById("errorMessage");
  errorBox.textContent = message;
  errorBox.style.display = "block";
  setTimeout(() => {
    errorBox.style.display = "none";
  }, 3000);
}

onAuthStateChanged(auth, (user) => {
    console.log(user);
    
    if (user.email == "muddasir@example.com") {
      window.location.href = "Admin.html";
      return;
    } else {
      window.location.href = "User.html";
      return;
    }
});

mainBtn.addEventListener("click", () => {
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirm");

  if (email.value == "" || password.value == "") {
    showError("Enter all values.");
    return;
  }

  if (isLogin) {
    signInWithEmailAndPassword(auth, email.value, password.value)
      .then((userCredential) => {
        const user = userCredential.user;
        if (user.email == "muddasir@example.com") {
          window.location.href = "Admin.html";
          return;
        } else {
          window.location.href = "User.html";
          return;
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // console.log(errorCode);
        // console.log(errorMessage);
        email.value = "";
        password.value = "";
        showError(errorCode);
      });
  } else {
    if (confirmPassword.value != password.value) {
      showError("Confirm password is not match.");
      return;
    }
    createUserWithEmailAndPassword(auth, email.value, password.value)
      .then((userCredential) => {
        const user = userCredential.user;
        email.value = "";
        password.value = "";
        confirmPassword.value = "";
        window.location.href = "User.html";
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        email.value = "";
        password.value = "";
        confirmPassword.value = "";
        showError(errorCode);
      });
  }
});
window.togglePassword = togglePassword;
