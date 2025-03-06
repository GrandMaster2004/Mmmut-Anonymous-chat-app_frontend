const ul = document.querySelector(".message-list");
const sendBtn = document.querySelector(".send-btn");
const messageInput = document.querySelector(".message-input");
const form = document.querySelector("form");
const onlineCount = document.getElementById("onlineCount");

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
    if (distance > 2) {
      alert("You are not in MMMUT Campus thats why chat not work");
      return;
    } else {
      const socket = io(
        // "http://localhost:3000"
        // "https://mmmut-anonymous-chat-app-backend.onrender.com"
        "https://imaginative-mochi-e288fc.netlify.app"
      );
      // https://mmmut-anonymous-chat-app-backend.onrender.com
      // http://localhost:3000
      // socket.on("check", (data) => {});
      socket.on("onlineUsers", (count) => {
        onlineCount.textContent = count;
        // console.log(count);
      });
      socket.on("sendthis", (obj) => {
        let runShowChat = false;
        if (isInViewport(ul.lastElementChild)) {
          runShowChat = true;
        }
        var li = document.createElement("li");
        li.innerHTML = `<span ><div class="user_name">${obj.user}</div></span><span class="left">${obj.msg}</span>`;
        ul.appendChild(li);

        if (runShowChat) {
          showLastChat();
        }
      });

      form.addEventListener("click", (e) => {
        e.preventDefault();
        if (messageInput.value === "") {
          return;
        }
        var li = document.createElement("li");
        li.innerHTML = `<span>${messageInput.value}</span>`;
        li.classList.add("right");
        ul.appendChild(li);
        socket.emit("message", { msg: messageInput.value, user: userName });
        messageInput.value = "";
        showLastChat();
      });
    }
  } catch (error) {
    console.error("Geolocation error:", error.message);
  }
}

function showLastChat() {
  ul.lastElementChild?.scrollIntoView({ behavior: "smooth" });
}
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

let userName = "";
while (!userName.trim()) {
  userName = prompt("Enter Your Name");
}

getUserLocationAndConnect();
