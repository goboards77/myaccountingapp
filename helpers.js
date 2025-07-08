// helpers.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// --- Firebase config ---
const firebaseConfig = {
  apiKey: "AIzaSyDQWZC6iA5zYKvTXsFl9TYLkZCTl5BzfwA",
  authDomain: "accounts-19d08.firebaseapp.com",
  projectId: "accounts-19d08",
  storageBucket: "accounts-19d08.firebasestorage.app",
  messagingSenderId: "247308606105",
  appId: "1:247308606105:web:9bfc179368524244bf3608"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// --- Auth check logic ---
export function setupAuthCheck(callbackOnLogin) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      document.getElementById("userEmail").textContent = `Logged in as ${user.email}`;
      if (callbackOnLogin) callbackOnLogin();
    } else {
      window.location.href = "login.html";
    }
  });
}

// --- Logout logic ---
export function logout() {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
}

// --- Sidebar logic ---
export function openSidebar() {
  document.getElementById("sidebar").style.left = "0";
}

export function closeSidebar() {
  document.getElementById("sidebar").style.left = "-250px";
}

export function setupSidebarCloseOnOutsideClick() {
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".sidebar") &&
      !e.target.closest(".hamburger")
    ) {
      closeSidebar();
    }
  });
}
