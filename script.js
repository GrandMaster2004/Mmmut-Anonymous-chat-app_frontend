// Select UI Elements
const ul = document.querySelector(".message-list");
const sendBtn = document.querySelector(".send-btn");
const messageInput = document.querySelector(".message-input");
const form = document.querySelector("form");
const onlineCount = document.getElementById("onlineCount");

// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCdOE4tDH5SUh-GhQXDtr-74hZm0VWk4ak",
  authDomain: "chatapp-ca958.firebaseapp.com",
  databaseURL: "https://chatapp-ca958-default-rtdb.firebaseio.com",
  projectId: "chatapp-ca958",
  storageBucket: "chatapp-ca958.firebasestorage.app",
  messagingSenderId: "566318675791",
  appId: "1:566318675791:web:c5d598dbd03ed2bd24b73a",
  measurementId: "G-V1LH4CJM9B",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to Write User Messages to Firestore
async function writeUserData(name, message) {
  await addDoc(collection(db, "users"), {
    name: name,
    message: message,
    timestamp: Timestamp.now(), // Add timestamp for deletion logic
  });
}

// Function to Delete Messages Older than 1 Hour
async function deleteOldMessages() {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const q = query(
    collection(db, "users"),
    where("timestamp", "<", Timestamp.fromDate(oneHourAgo))
  );

  try {
    const snapshot = await getDocs(q);
    snapshot.forEach(async (docSnap) => {
      await deleteDoc(doc(db, "users", docSnap.id));
    });
  } catch (error) {
    console.error("❌ Error deleting old messages:", error);
  }
}

// Delete Old Messages Every 5 Minutes
setInterval(deleteOldMessages, 5 * 60 * 1000);

// Function to Read Messages from Firestore
async function readData() {
  const snapshot = await getDocs(collection(db, "users"));
  snapshot.forEach((childsnapShot) => {
    let name = childsnapShot.data().name;
    let msg = childsnapShot.data().message;
    let li = document.createElement("li");
    if (userName === name) {
      li.innerHTML = `<span>${msg}</span>`;
      li.classList.add("right");
    } else {
      li.innerHTML = `<span ><div class="user_name">${name}</div></span><span class="left">${msg}</span>`;
    }
    ul.appendChild(li);
  });
  showLastChat();
}

// Geolocation & Chat Connection
async function getUserLocationAndConnect() {
  try {
    if (!navigator.geolocation) throw new Error("Geolocation not supported");
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    });
    const { latitude, longitude } = position.coords;
    const allowedRadius = 2; // 2 KM Limit
    if (
      haversine(latitude, longitude, 26.7354656, 83.4378953) > allowedRadius
    ) {
      alert("You are not in MMMUT Campus, chat not allowed.");
      return;
    }
    const socket = io("https://mmmut-anonymous-chat-app-backend.onrender.com");
    socket.on("onlineUsers", (count) => {
      onlineCount.textContent = count;
    });
    socket.on("sendthis", (obj) => {
      let li = document.createElement("li");
      li.innerHTML = `<span><div class="user_name">${obj.user}</div></span><span class="left">${obj.msg}</span>`;
      ul.appendChild(li);
      showLastChat();
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (messageInput.value === "") return;
      let li = document.createElement("li");
      li.innerHTML = `<span>${messageInput.value}</span>`;
      li.classList.add("right");
      ul.appendChild(li);
      socket.emit("message", { msg: messageInput.value, user: userName });
      writeUserData(userName, messageInput.value);
      messageInput.value = "";
      showLastChat();
    });
  } catch (error) {
    console.error("Geolocation error:", error.message);
  }
}

// Show Last Chat in View
function showLastChat() {
  ul.lastElementChild?.scrollIntoView({ behavior: "smooth" });
}

// Haversine Formula to Calculate Distance
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRadians = (angle) => angle * (Math.PI / 180);
  const dlat = toRadians(lat2 - lat1);
  const dlon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dlon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Prompt User for Name
let userName = localStorage.getItem("userName") || "";
while (!userName.trim()) {
  userName = prompt("Enter Your Name");
  localStorage.setItem("userName", userName);
}

// Initialize Chat
getUserLocationAndConnect();
readData();
