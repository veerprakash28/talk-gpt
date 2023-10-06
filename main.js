// DOM Elements
const texts = document.querySelector(".texts");
const loader = document.querySelector(".loader");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

// Speech Recognition Setup
window.speechRecognition =
  window.speechRecognition || window.webkitSpeechRecognition;

const recognition = new window.speechRecognition();
recognition.interimResults = true;

// Function to fetch response from ChatGPT
const ENDPOINT =
  "https://talk-gpt-server-nw6c.onrender.com/talkgpt/getGPTResponse" ||
  "http://localhost:3002/talkgpt/getGPTResponse";

const getGPTResponse = async (prompt) => {
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ prompt }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const { data } = await response.json();
    return data.replace(/\n/g, "").trim();
  } catch (error) {
    console.error("Error fetching GPT response:", error);
    throw error;
  }
};

// Text-to-Speech Functions
const playTextToSpeech = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
};

const stopTextToSpeech = () => {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
};

// Event Listener for Speech Recognition
recognition.addEventListener("result", async (e) => {
  const text = Array.from(e.results)
    .map((result) => result[0])
    .map((result) => result.transcript)
    .join("");

  // Create a new paragraph for displaying user input
  const userMessage = document.createElement("p");
  userMessage.textContent = text;
  texts.insertBefore(userMessage, texts.firstChild);

  if (e.results[0].isFinal) {
    try {
      loader.classList.add("loading");

      let reply = "";

      // Check for specific queries
      if (text.includes("what is your name") || text.includes("what's your name")) {
        reply = "My name is TalkGPT";
      } else if (text.includes("clear the chat")) {
        texts.innerHTML = "";
        reply = "Conversation cleared!";
      } else if (text.includes("who is your owner")) {
        reply = "Veer Prakash";
      } else {
        // Get response from ChatGPT
        reply = await getGPTResponse(text);
      }

      loader.classList.remove("loading");

      // Play text-to-speech for the response
      stopTextToSpeech();
      playTextToSpeech(reply);

      // Display the response in a new paragraph
      const chatbotResponse = document.createElement("p");
      chatbotResponse.classList.add("replay");
      chatbotResponse.textContent = reply;
      texts.insertBefore(chatbotResponse, texts.firstChild);
    } catch (error) {
      console.error("Error processing speech recognition:", error);
    }

    // Clear the user input field
    userInput.value = "";
  }
});

recognition.addEventListener("end", () => {
  recognition.start();
});

// Event Listener for form submission
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userMessage = userInput.value.trim();
  if (userMessage === "") {
    return;
  }

  const userMessageElement = document.createElement("p");
  userMessageElement.textContent = userMessage;
  texts.insertBefore(userMessageElement, texts.firstChild);

  try {
    loader.classList.add("loading");
    let reply = "";

    if (userMessage.includes("what is your name") || userMessage.includes("what's your name")) {
      reply = "My name is TalkGPT";
    } else if (userMessage.includes("clear the chat")) {
      texts.innerHTML = "";
      reply = "Conversation cleared!";
    } else if (userMessage.includes("who is your owner")) {
      reply = "Veer Prakash";
    } else {
      reply = await getGPTResponse(userMessage);
    }

    loader.classList.remove("loading");

    stopTextToSpeech();
    playTextToSpeech(reply);

    const chatbotResponse = document.createElement("p");
    chatbotResponse.classList.add("replay");
    chatbotResponse.textContent = reply;
    texts.insertBefore(chatbotResponse, texts.firstChild);
  } catch (error) {
    console.error("Error processing form submission:", error);
  }

  userInput.value = "";
});

// Start speech recognition
recognition.start();
