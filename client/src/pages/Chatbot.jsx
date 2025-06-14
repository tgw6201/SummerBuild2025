import React, { useState, useEffect, useRef } from 'react';

export default function Chatbot() {
  /* State Management */
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hi! How can I help you today?' }
  ]);
  const [input, setInput] = useState(''); // Current text in the input field
  const [isTyping, setIsTyping] = useState(false); // Boolean to show/hide typing indicator

  /* Refs for DOM Access */
  const messagesEndRef = useRef(null);  // Points to bottom of messages (for auto-scroll)
  const inputRef = useRef(null); // Points to input field (for auto-focus)

  /* Auto-scroll Effect */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* Auto-focus Effect */
  useEffect(() => {
    inputRef.current?.focus(); // Put cursor inside box
  }, []);

  /* Send Message Function */
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage = { 
      id: Date.now(), 
      sender: 'user', 
      text: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    /* Simulated Bot Response */
    setTimeout(() => {
      const responses = [
        "That's an interesting question! Let me think about that...",
        "I understand what you're asking. Here's my perspective on that topic.",
        "Great question! Based on what you've shared, I'd suggest considering...",
        "Thanks for asking! Here's what I think about that...",
        "I see what you mean. Let me provide some insights on this.",
        "That's a thoughtful question. Here's how I would approach it..."
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const botMessage = { 
        id: Date.now() + 1,
        sender: 'bot', 
        text: randomResponse
      };
      
      setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        inputRef.current?.focus();
      }, 1200);
  };

  /* Keyboard Handler */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <h3 className="chat-header">CalorieBot</h3>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}

        {isTyping && (
        <div className="message bot typing">
          Bot is typing...
        </div>
      )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}