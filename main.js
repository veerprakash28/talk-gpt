const messagesContainer = document.querySelector(".messages");
const welcomeScreen = document.querySelector(".welcome-screen");
const loader = document.querySelector(".loader");
const textarea = document.querySelector("textarea");
const sendButton = document.querySelector(".send-btn");
const micButton = document.querySelector(".mic-btn");
const voiceStopButton = document.querySelector(".voice-stop-btn");
const clearButton = document.querySelector(".clear-btn");
const form = document.querySelector(".input-form");

// State
let isListening = false;
let recognition = null;
let restartRecognition = true;

// Initialize speech recognition
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const hasSpeechRecognition = !!SpeechRecognition;

if (!hasSpeechRecognition) {
  console.error("Speech Recognition is not supported in this browser.");
  micButton.style.display = "none";
}

// API endpoint
const ENDPOINT =
  "https://talk-gpt-server-nw6c.onrender.com/talkgpt/getGPTResponse";

// Format message text
function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\. (?=[A-Z])/g, ".<br><br>")
    .replace(/\n/g, "<br>")
    .replace(/- (.*?)(?=\n|$)/g, "• $1")
    .replace(/(\d+)\. (.*?)(?=\n|$)/g, "<span class='font-bold'>$1.</span> $2");
}

// Create message element
function createMessageElement(text, isUser) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user" : "assistant"}`;

  if (isUser) {
    messageDiv.textContent = text;
  } else {
    messageDiv.innerHTML = formatMessage(text);
  }

  return messageDiv;
}

// Add message to chat
function addMessage(text, isUser) {
  if (welcomeScreen) {
    welcomeScreen.style.display = "none";
  }

  const messageElement = createMessageElement(text, isUser);
  messagesContainer.appendChild(messageElement);
  messageElement.scrollIntoView({ behavior: "smooth" });
}

// Handle message submission
async function handleMessage(text) {
  if (!text.trim()) return;

  addMessage(text, true);
  loader.classList.add("visible");

  let reply = "";

  try {
    if (
      text.toLowerCase().includes("what is your name") ||
      text.toLowerCase().includes("what's your name")
    ) {
      reply = "My name is TalkGPT";
    } else if (text.toLowerCase().includes("clear the chat")) {
      clearChat();
      reply = "Conversation cleared!";
    } else if (text.toLowerCase().includes("who is your owner")) {
      reply = "Veer Prakash";
    } else if (text.toLowerCase().includes("stop speaking")) {
      stopTextToSpeech();
      reply = "I've stopped speaking.";
    } else {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        body: JSON.stringify({ prompt: text }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const output = await response.json();
      reply = output.data.replace(/\n/g, "");
    }

    loader.classList.remove("visible");
    addMessage(reply, false);

    // Text to speech
    if (!text.toLowerCase().includes("stop speaking")) {
      stopTextToSpeech();
      playTextToSpeech(reply);
    }
  } catch (error) {
    console.error("Error:", error);
    loader.classList.remove("visible");
    addMessage("OOPS! Something went wrong. Maybe the server is down!", false);
  }
}

// Setup and start continuous speech recognition
function setupContinuousSpeechRecognition() {
  if (!hasSpeechRecognition) return;

  recognition = new SpeechRecognition();

  // Enable continuous recognition
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const lastResult = event.results[event.results.length - 1];
    if (lastResult.isFinal) {
      const text = lastResult[0].transcript;
      handleMessage(text);
    }
  };

  recognition.onend = () => {
    // Only restart if we're still in listening mode
    if (isListening && restartRecognition) {
      // Small delay before restarting to avoid rapid restarts
      setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          console.error("Error restarting recognition:", e);
        }
      }, 100);
    } else {
      isListening = false;
      micButton.classList.remove("listening");
      micButton.title = "Start continuous listening";
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);

    // Don't restart on these errors
    if (
      event.error === "not-allowed" ||
      event.error === "service-not-allowed"
    ) {
      restartRecognition = false;
    }
  };

  try {
    recognition.start();
    isListening = true;
    micButton.classList.add("listening");
    micButton.title = "Stop listening";
  } catch (e) {
    console.error("Error starting recognition:", e);
  }
}

// Start listening
function startListening() {
  if (!hasSpeechRecognition || isListening) return;

  restartRecognition = true;
  setupContinuousSpeechRecognition();
}

// Stop listening
function stopListening() {
  if (!recognition) return;

  restartRecognition = false;

  try {
    recognition.stop();
  } catch (e) {
    console.error("Error stopping recognition:", e);
  }

  recognition = null;
  isListening = false;
  micButton.classList.remove("listening");
  micButton.title = "Start continuous listening";
}

// Text to speech handlers
function playTextToSpeech(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;

  utterance.onstart = () => {
    voiceStopButton.classList.add("visible");
  };

  utterance.onend = () => {
    voiceStopButton.classList.remove("visible");
  };

  speechSynthesis.speak(utterance);
}

function stopTextToSpeech() {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  voiceStopButton.classList.remove("visible");
}

// Clear chat
function clearChat() {
  messagesContainer.innerHTML = "";
  welcomeScreen.style.display = "flex";
}

// Event listeners
textarea.addEventListener("input", () => {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  sendButton.disabled = !textarea.value.trim();
});

// Handle form submission
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = textarea.value.trim();
  if (text) {
    handleMessage(text);
    textarea.value = "";
    textarea.style.height = "auto";
    sendButton.disabled = true;
  }
});

// Handle Enter key press in textarea
textarea.addEventListener("keydown", (e) => {
  // Submit on Enter without Shift key
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // Prevent default newline
    form.dispatchEvent(new Event("submit"));
  }
});

// Toggle mic button
micButton.addEventListener("click", () => {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
});

// Stop speaking button
voiceStopButton.addEventListener("click", stopTextToSpeech);

// Clear button
clearButton.addEventListener("click", clearChat);
