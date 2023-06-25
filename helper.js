export async function gptResponse(prompt) {
  const response = await fetch("http://localhost:3002/getGPTResponse", {
    method: "POST",
    body: JSON.stringify({ prompt }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const output = await response.json();
  const reply = output.data.replace(/\n/g, "");
  return reply;
}
