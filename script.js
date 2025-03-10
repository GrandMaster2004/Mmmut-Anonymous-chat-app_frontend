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
  orderBy,
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
async function writeUserData_reply(name, message, reply) {
  await addDoc(collection(db, "users"), {
    name: name,
    message: message,
    reply: reply,
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
  const q = query(
    collection(db, "users"),
    orderBy("timestamp", "asc") // Correct placement of orderBy()
  );

  const snapshot = await getDocs(q);

  snapshot.forEach((childsnapShot) => {
    let name = childsnapShot.data().name;
    let msg = childsnapShot.data().message;
    let reply = childsnapShot.data().reply;
    let time = childsnapShot.data().timestamp;
    const currentDate = time.toDate();

    // Extract hours and minutes
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();

    let li = document.createElement("li");
    if (userName === name) {
      li.classList.add("self");
      li.innerHTML = `<div class="avatar">
          <img src="https://i.imgur.com/HYcn9xO.png" draggable="false" />
        </div>
        <div class="msg" onclick="selectMessage(this)">
          ${
            reply !== undefined
              ? `<p class="reply"><span class="user_name" >${name}</span>${reply}</p>`
              : ""
          }
          <p class="message">
          ${msg}
          </p>
          <time>${hours}:${minutes}</time>
        </div>`;
    } else {
      li.classList.add("other");
      li.innerHTML = `<div class="avatar">
          <img src="https://i.imgur.com/HYcn9xO.png" draggable="false" />
        </div>
        <div class="msg" onclick="selectMessage(this)">
          ${
            reply !== undefined
              ? `<p class="reply"><span class="user_name" >${name}</span>${reply}</p>`
              : `<p class="user_name">${name}</p>`
          }
          <p class="message">
          ${msg}
          </p>
          <time>${hours}:${minutes}</time>
        </div>`;
    }
    ul.appendChild(li);
  });
  showLastChat();
}

// Geolocation & Chat Connection
async function getUserLocationAndConnect() {
  try {
    if (!navigator.geolocation)
      throw new Error(
        alert(
          "You are not in MMMUT Campus, chat not allowed. You can try on location"
        )
      );
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    });
    const { latitude, longitude } = position.coords;
    const allowedRadius = 2; // 2 KM Limit
    // if (
    //   haversine(latitude, longitude, 26.7354656, 83.4378953) > allowedRadius
    // ) {
    //   alert("You are not in MMMUT Campus, chat not allowed.");
    //   return;
    // } else {
    // console.log(haversine(latitude, longitude, 26.7354656, 83.4378953));

    readData();

    const socket = io(
      // "http://127.0.0.1:3000"
      "https://mmmut-anonymous-chat-app-backend.onrender.com"
    );
    socket.on("onlineUsers", (count) => {
      onlineCount.textContent = count;
    });
    const now = new Date();

    // Get the current hours, minutes, and seconds
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const currentTime = `${hours}:${minutes}`;

    // console.log("Current time:", currentTime);
    socket.on("sendthis", (obj) => {
      let li = document.createElement("li");
      let reply = obj.userreply;
      li.classList.add("other");
      li.innerHTML = `<div class="avatar">
          <img src="https://i.imgur.com/HYcn9xO.png" draggable="false" />
        </div>
        <div class="msg" onclick="selectMessage(this)">
          ${
            reply !== undefined
              ? `<p class="reply"><span class="user_name">${obj.user}</span>${reply}</p>`
              : `<p class="user_name">${obj.user}</p>`
          }
          <p class="message">
          ${obj.msg}
          </p>
          <time>${currentTime}</time>
        </div>`;
      ul.appendChild(li);
      showLastChat();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (messageInput.value === "") return;
      let li = document.createElement("li");
      let reply = document.getElementById("reply-box");

      li.classList.add("self");
      reply = reply ? reply.innerText.trim() : null;

      // console.log(sen);

      if (reply) {
        // console.log("in the replya secontion");
        let sen = reply.slice(0, -3);
        li.innerHTML = `<div class="avatar">
          <img src="https://i.imgur.com/HYcn9xO.png" draggable="false" />
        </div>
        <div class="msg" onclick="selectMessage(this)">
          
            ${reply !== undefined ? `<p class="reply">${sen}</p>` : ""}
          
          <p class="message">
          ${messageInput.value}
          </p>
          <time>${currentTime}</time>
        </div>`;

        socket.emit("message", {
          msg: messageInput.value,
          user: userName,
          userreply: sen,
        });
        writeUserData_reply(userName, messageInput.value, sen);
        document.getElementById("reply-section").innerHTML = "";
      } else {
        li.innerHTML = ` <div class="avatar">
          <img src="https://i.imgur.com/HYcn9xO.png" draggable="false" />
        </div>
        <div class="msg" onclick="selectMessage(this)">
          
          <p class="message">
            ${messageInput.value}
          </p>
          
          <time>${currentTime}</time>
        </div>`;
        socket.emit("message", {
          msg: messageInput.value,
          user: userName,
        });
        writeUserData(userName, messageInput.value);
      }
      ul.appendChild(li);

      messageInput.value = "";
      showLastChat();
    });
    // }
  } catch (error) {
    alert(
      "You are not in MMMUT Campus, chat not allowed. You can try on location"
    );
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
