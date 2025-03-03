const ul = document.querySelector(".message-list");
const sendBtn = document.querySelector(".send-btn");
const messageInput = document.querySelector(".message-input");
const form = document.querySelector("form");

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in KM
  const toRadians = (angle) => angle * (Math.PI / 180);
  lat1 = toRadians(lat1);
  lon1 = toRadians(lon1);
  lat2 = toRadians(lat2);
  lon2 = toRadians(lon2);

  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;

  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// ✅ Get User Location and Connect to WebSocket
async function getUserLocationAndConnect() {
  try {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported by this browser.");
    }

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    });

    const { latitude, longitude } = position.coords;
    const latitude_center = 26.7354656;
    const longitude_center = 83.4378953;

    const distance = haversine(
      latitude,
      longitude,
      latitude_center,
      longitude_center
    );
    console.log(`Distance from center: ${distance} km`);

    if (distance > 2) {
      console.log("You are out of the allowed range.");
      return;
    }

    // ✅ WebSocket Connection
    const socket = io("https://locahost:5500", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => console.log("Connected to WebSocket Server"));

    socket.on("check", (data) => console.log("Server message:", data));

    socket.on("sendthis", (obj) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${obj.user}</span>: ${obj.msg}`;
      ul.appendChild(li);
      showLastChat();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (messageInput.value.trim() === "") return;

      const li = document.createElement("li");
      li.innerText = messageInput.value;
      li.classList.add("right");
      ul.appendChild(li);

      socket.emit("message", { msg: messageInput.value, user: userName });

      messageInput.value = "";
      showLastChat();
    });
  } catch (error) {
    console.error("Geolocation error:", error.message);
  }
}

// ✅ Scroll to Last Chat
function showLastChat() {
  ul.lastElementChild?.scrollIntoView({ behavior: "smooth" });
}

// ✅ Ask for Username Before Connecting
let userName = "";
while (!userName.trim()) {
  userName = prompt("Enter Your Name");
}

// ✅ Start the App
getUserLocationAndConnect();
