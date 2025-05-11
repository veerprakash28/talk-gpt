const texts = document.querySelector(".texts");
const loader = document.querySelector(".loader");
const manualInput = document.getElementById("manualInput");
const sendBtn = document.getElementById("sendBtn");

// ====== Shared GPT + TTS logic ======

// GPT API endpoint
const ENDPOINT =
  "https://talk-gpt-server-nw6c.onrender.com/talkgpt/getGPTResponse";
// "http://localhost:3002/talkgpt/getGPTResponse";
const gptResponse = async (prompt) => {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ prompt }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const output = await response.json();
    const reply = output.data.replace(/\n/g, "");
    return reply;
  } catch (error) {
    console.error("Error fetching GPT response:", error);
    throw error;
  }
};

// TTS
function playTextToSpeech(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}

function stopTextToSpeech() {
  console.log("is speaking: ", speechSynthesis.speaking);
  speechSynthesis.resume();
  speechSynthesis.cancel();
}

// Process message (both for speech and text)
async function handleMessage(text) {
  if (!text) return;

  let userP = document.createElement("p");
  userP.innerText = text;
  texts.insertBefore(userP, texts.firstChild);

  loader.classList.add("loading");

  let reply = "";
  let replyP = document.createElement("p");
  replyP.classList.add("replay");

  if (text.includes("what is your name") || text.includes("what's your name")) {
    reply = "My name is TalkGPT";
  } else if (text.includes("clear the chat")) {
    texts.innerHTML = "";
    reply = "Conversation cleared!";
  } else if (text.includes("who is your owner")) {
    reply = "Veer Prakash";
  } else {
    try {
      reply = await gptResponse(text);
    } catch (error) {
      replyP.classList.remove("replay");
      replyP.classList.add("error");
      reply = "OOPS! Something went wrong. Maybe the server is down!";
    }
  }

  loader.classList.remove("loading");

  stopTextToSpeech();
  playTextToSpeech(reply);

  replyP.innerText = reply;
  texts.insertBefore(replyP, texts.firstChild);
}

// ====== Voice Recognition Logic ======

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  console.error("SpeechRecognition is not supported in this browser.");
} else {
  const recognition = new SpeechRecognition();
  recognition.interimResults = true;

  let p = document.createElement("p");

  recognition.addEventListener("result", async (e) => {
    const text = Array.from(e.results)
      .map((result) => result[0])
      .map((result) => result.transcript)
      .join("");

    p.innerText = text;
    texts.appendChild(p);

    texts.insertBefore(p, texts.firstChild);
    loader.classList.add("loading");

    if (e.results[0].isFinal) {
      await handleMessage(text);

      p = document.createElement("p");
    }

    console.log(text);
  });

  recognition.addEventListener("end", () => {
    recognition.start();
  });

  recognition.start();
}

// ====== Manual Text Input Handler ======

sendBtn.addEventListener("click", async () => {
  const text = manualInput.value.trim();
  if (!text) return;

  await handleMessage(text);
  manualInput.value = "";
});

manualInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});
