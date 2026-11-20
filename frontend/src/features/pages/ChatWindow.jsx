import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, MessageSquare } from 'lucide-react';

export default function ChatWindow({ threadId, messages, setMessages }) {

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const fetchHistory = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          `http://localhost:8000/get_thread_history/${encodeURIComponent(threadId)}`
        );

        if (cancelled) return;

        const formattedMessages = (response.data.messages || []).map(
          (msg, index) => ({
            id: `${threadId}-${index}`,
            type:
              msg.role === 'user'
                ? 'human'
                : msg.role === 'assistant'
                ? 'ai'
                : 'tool',
            text:
              typeof msg.content === 'string'
                ? msg.content
                : JSON.stringify(msg.content),
            threadId
          })
        );

        setMessages(formattedMessages);

      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching chat history:', error);
          setMessages([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };

  }, [threadId, setMessages]);


  if (!threadId) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#738375] text-base">
        <MessageSquare size={24} className="mr-3" />
        Select a conversation to view messages.
      </div>
    );
  }


  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#526355] text-base">
        <Loader2 size={24} className="animate-spin mr-3" />
        Loading conversation...
      </div>
    );
  }


  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">

      {messages.length === 0 ? (
        <p className="text-center text-[#738375] text-base">
          No messages found.
        </p>
      ) : (

        messages.map((msg, index) => (

          <div
            key={msg.id || index}
            className={`flex ${
              msg.type === 'human' ? 'justify-end' : 'justify-start'
            }`}
          >

            <div
              className={`max-w-[80%] px-6 py-5 rounded-2xl text-base leading-7 shadow-sm ${
                msg.type === 'human'
                  ? 'bg-[#4a7c59] text-white rounded-br-sm'
                  : 'bg-white/70 text-[#273529] border border-[#ece9e1] rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>

          </div>

        ))
      )}

    </div>
  );
}