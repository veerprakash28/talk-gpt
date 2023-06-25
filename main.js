const texts = document.querySelector(".texts");
const loader = document.querySelector(".loader");

window.speechRecognition =
  window.speechRecognition || window.webkitSpeechRecognition;

const recognition = new window.speechRecognition();

recognition.interimResults = true;

let p = document.createElement("p");

// Function to fetch response from ChatGPT
const ENDPOINT =
  "https://talk-gpt-server-nw6c.onrender.com/talkgpt/getGPTResponse" ||
  "http://localhost:3002/talkgpt/getGPTResponse";
const gptResponse = async (prompt) => {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ prompt }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const output = await response.json();
  const reply = output.data.replace(/\n/g, "");
  // const reply = output.data;
  return reply;
};

// Functions for Text-to-Speech

function playTextToSpeech(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}

function stopTextToSpeech() {
  speechSynthesis.resume();
  speechSynthesis.cancel();
}

// Recognition Event Listener
recognition.addEventListener("result", async (e) => {
  const text = Array.from(e.results)
    .map((result) => result[0])
    .map((result) => result.transcript)
    .join("");

  p.innerText = text;
  texts.appendChild(p);

  // To add Query at the top
  const firstChild = texts.firstChild;
  texts.insertBefore(p, firstChild);

  loader.classList.add("loading");
  if (e.results[0].isFinal) {
    let reply = "";

    p = document.createElement("p");
    p.classList.add("replay");

    // Check Query
    if (
      text.includes("what is your name") ||
      text.includes("what's your name")
    ) {
      reply = "My name is TalkGPT";
    } else if (text.includes("clear the chat")) {
      texts.innerHTML = "";
      reply = "Conversation cleared!";
    } else if (text.includes("who is your owner")) {
      reply = "Veer Prakash";
    } else {
      // Get Response from ChatGPT
      try {
        reply = await gptResponse(text);
      } catch (error) {
        p.classList.remove("replay");
        p.classList.add("error");
        reply = "OOPS! Something went wrong. Maybe the server is down!";
      }
      console.log("Reply: ", reply);
    }

    loader.classList.remove("loading");

    // Text to Speech
    stopTextToSpeech();
    playTextToSpeech(reply);

    //   Final reply
    p.innerText = reply; //  add the response of GPT or query
    texts.appendChild(p);

    // To add Reply at the top
    const firstChild = texts.firstChild;
    texts.insertBefore(p, firstChild);

    // To create paragraph for next query
    p = document.createElement("p");
  }

  console.log(text);
});

recognition.addEventListener("end", () => {
  recognition.start();
});

recognition.start();
