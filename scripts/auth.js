import { auth } from "./init.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Bienvenido:", userCredential.user.email);
    window.location.href = "restricted.html";
  } catch (error) {
    alert("Error: " + error.message);
  }
});