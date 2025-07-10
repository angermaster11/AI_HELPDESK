// src/api/api.js
import axios from 'axios';

const BASE_URL = 'http://localhost:8000'; // or your deployed backend

export const sendMessageToBot = async (message) => {
  try {
    const response = await axios.post(`${BASE_URL}/chat`, message); // send message directly
    return response.data?.output || "No response";
  } catch (err) {
    console.error("Error sending message:", err);
    return "Something went wrong. Try again.";
  }
};
