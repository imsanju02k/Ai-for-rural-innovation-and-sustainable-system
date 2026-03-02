# Integration Example: Advisory Chat Interaction

AI-powered advisory chatbot integration.

## Send Chat Message

```typescript
import { ChatMessageRequest, ChatMessageResponse } from '@ai-rural-platform/types';

async function sendChatMessage(
  message: string,
  farmId?: string
): Promise<ChatMessageResponse> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch('/api/advisory/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      farmId,
      includeContext: true,
    }),
  });

  return response.json();
}
```

## React Chat Component

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@ai-rural-platform/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function AdvisoryChat({ farmId }: { farmId?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadChatHistory() {
    const token = localStorage.getItem('accessToken');
    const response = await fetch('/api/advisory/history?limit=50', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    setMessages(data.messages);
  }

  async function handleSend() {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(input, farmId);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="content">{msg.content}</div>
            <div className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {loading && <div className="message assistant loading">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about farming practices..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
```

## Example Queries

```typescript
// General farming advice
await sendChatMessage('What is the best time to plant wheat in North India?');

// Farm-specific advice
await sendChatMessage(
  'Based on my current soil moisture levels, should I irrigate today?',
  farmId
);

// Pest control
await sendChatMessage('How do I control aphids on my tomato plants?');

// Fertilizer recommendations
await sendChatMessage('What fertilizer should I use for rice in the vegetative stage?');
```
