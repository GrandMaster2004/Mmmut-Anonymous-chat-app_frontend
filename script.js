const ul = document.querySelector(".message-list");
const sendBtn = document.querySelector(".send-btn");
const messageInput = document.querySelector(".message-input");
const form = document.querySelector("form");

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRadians = (angle) => angle * (Math.PI / 180);
  lat1 = toRadians(lat1);
  lon1 = toRadians(lon1);
  lat2 = toRadians(lat2);
  lon2 = toRadians(lon2);

  // Compute differences
  const dlat = lat2 - lat1;
  const dlon = lon2 - lon1;

  // Haversine formula
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance;
}

const location1 = async () => {
  if (navigator.geolocation) {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          let latitude_center = 26.7354656;
          let longitude_center = 83.4378953;
          const distance = haversine(
            latitude,
            longitude,
            latitude_center,
            longitude_center
          );
          if (distance <= 2) {
            console.log(`${distance} here is the data`);

            const socket = io("http://localhost:3000");
            socket.on("check", (data) => {
              console.log(data);
            });

            socket.on("sendthis", (obj) => {
              let runShowChat = false;
              if (isInViewport(ul.lastElementChild)) {
                runShowChat = true;
              }
              var li = document.createElement("li");
              li.innerHTML = `<span>${obj.user}</span>${obj.msg}`;
              ul.appendChild(li);

              if (runShowChat) {
                showLastChat();
              }
            });

            form.addEventListener("submit", (e) => {
              e.preventDefault();
              if (messageInput.value === "") {
                return;
              }
              var li = document.createElement("li");
              li.innerText = messageInput.value;
              li.classList.add("right");
              ul.appendChild(li);

              socket.emit("message", {
                msg: messageInput.value,
                user: userName,
              });

              messageInput.value = "";
              showLastChat();
            });

            function showLastChat() {
              ul.lastElementChild.scrollIntoView({ behavior: "smooth" });
            }

            // var nameList = ["Mahesh", "Meet", "Shimon", "Shreya", "Aman"];
            // var greetMsgList = [
            //   "Hi",
            //   "Hello",
            //   "Namaste",
            //   "what's up",
            //   "good morning",
            // ];

            function isInViewport(element) {
              const rect = element.getBoundingClientRect();
              return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <=
                  (window.innerHeight ||
                    document.documentElement.clientHeight) &&
                rect.right <=
                  (window.innerWidth || document.documentElement.clientWidth)
              );
            }
          } else {
            console.log("some thing error");
          }
          resolve({ latitude, longitude });
        },
        (error) => {
          showDetails.textContent = error.message;
          console.log(error.message);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  } else {
    throw new Error("Geolocation is not supported by this browser.");
  }
};
location1();
var userName = "";
while (userName === "") {
  userName = prompt("Enter Your Name ");
  if (userName !== "") {
    break;
  }
}
