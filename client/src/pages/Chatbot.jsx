import React, { useState, useEffect, useRef } from "react";
import "../css/Chatbot.css";

export default function Chatbot() {
  /* State Management */
  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: "CalorieBot",
      messages: [
        { id: 1, sender: "bot", text: "Hi! How can I help you today?" },
      ],
    },
    {
      id: 2,
      title: "RecipeBot",
      messages: [{ id: 1, sender: "bot", text: "What recipe do you want?" }],
    },
  ]);
  const [activeConversationId, setActiveConversationId] = useState(1);
  const [input, setInput] = useState(""); // Current text in the input field
  const [isTyping, setIsTyping] = useState(false); // Boolean to show/hide typing indicator

  /* Refs for DOM Access */
  const messagesEndRef = useRef(null); // Points to bottom of messages (for auto-scroll)
  const inputRef = useRef(null); // Points to input field (for auto-focus)

  /* Auto-scroll Effect */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeConversationId, isTyping]);

  /* Auto-focus Effect */
  useEffect(() => {
    inputRef.current?.focus(); // Put cursor inside box
  }, []);

  /* Send Message Function */
  const handleSend = async (msg) => {
    const messageToSend = msg !== undefined ? msg : input;
    if (!messageToSend.trim() || isTyping) return;

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === activeConversationId
          ? {
              ...conv,
              messages: [
                ...conv.messages,
                { id: Date.now(), sender: "user", text: messageToSend.trim() },
              ],
            }
          : conv
      )
    );
    setInput("");
    setIsTyping(true);

    try {
      // Debug: log all cookies
      console.log("document.cookie:", document.cookie);

      // Get sessionid from cookie
      const sessionid = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sessionid="))
        ?.split("=")[1];

      console.log("Sending to /chat:", {
        sessionid,
        message: messageToSend.trim(),
      });

      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // this sends cookies!
        body: JSON.stringify({
          message: messageToSend.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [
                  ...conv.messages,
                  { id: Date.now() + 1, sender: "bot", text: data.response },
                ],
              }
            : conv
        )
      );
    } catch (error) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [
                  ...conv.messages,
                  {
                    id: Date.now() + 1,
                    sender: "bot",
                    text: "Error: Could not reach AI service.",
                  },
                ],
              }
            : conv
        )
      );
    }
    setIsTyping(false);
    inputRef.current?.focus();
  };

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  /* Keyboard Handler */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* Suggested messages for user convenience */
  const suggestions = ["Suggest recipe", "Log meal"];

  return (
    <div className="app-container">
      <div className="chat-container">
        <h3 className="chat-header">RennyBot</h3>

        <div className="chat-messages">
          {(activeConversation?.messages || []).map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender}`}>
              <strong>{msg.sender === "bot" ? "Bot" : "You"}: </strong>
              {msg.text.split("\n").map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < msg.text.split("\n").length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          ))}

          {isTyping && (
            <div className="message bot typing">Bot is typing...</div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chat-suggestions">
          {suggestions.map((text) => (
            <button
              key={text}
              className="suggestion-bubble"
              type="button"
              onClick={() => handleSend(text)}
            >
              {text}
            </button>
          ))}
        </div>

        <div className="chat-input">
          <textarea
            placeholder="Type your message..."
            value={input}
            ref={inputRef}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={2}
            style={{ resize: "none" }}
          />
          <button onClick={() => handleSend()} className="send-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
            >
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
