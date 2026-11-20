import React, { useState } from 'react';

import Sidebar from './features/pages/Sidebar';
import ChatWindow from './features/pages/ChatWindow';
import InputDock from './features/pages/InputDock';

import { Sparkles, Bot } from 'lucide-react';

export default function App() {

  // Active conversation
  const [activeSessionId, setActiveSessionId] = useState(
    () => crypto.randomUUID()
  );

  const [activeSessionName, setActiveSessionName] = useState("New Chat")
  const [messages, setMessages] = useState([]);
  const [refreshThreads, setRefreshThreads] = useState(0);

  // Add messages to conversation
  const handleSendMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  // Create new conversation
  const handleNewChat = () => {

    const newThreadId = crypto.randomUUID();

    setMessages([]);
    setActiveSessionId(newThreadId);
    // setActiveSessionName("New Chat")

    console.log("New thread created:", newThreadId);
  };

  // Open existing conversation
  const handleSelectSession = (threadId,thread_name) => {

    setMessages([]);
    setActiveSessionId(threadId);
    setActiveSessionName(thread_name)
  };

  return (

    <div className="flex h-screen w-screen bg-[#f8f7f4] font-sans overflow-hidden text-[#1c241d]">

      {/* Sidebar */}
      <Sidebar
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        refreshThreads={refreshThreads}
      />

      {/* Main Chat Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">

        {/* Conversation Header */}
        <header className="h-14 px-6 border-b border-[#e5e3dc] flex items-center justify-between bg-[#f8f7f4] shrink-0">

          {/* Left Section */}
          <div className="flex items-center gap-3 min-w-0">

            <div className="w-8 h-8 rounded-lg bg-[#e8e6df] flex items-center justify-center shrink-0">

              <Sparkles
                size={17}
                className="text-[#4a7c59]"
              />

            </div>

            <div className="flex items-center gap-3 min-w-0">

              <h1 className="text-sm font-semibold text-[#1c241d] whitespace-nowrap">
                Current Conversation
              </h1>

              <span className="text-[11px] bg-[#e8e5dc] text-[#141815] px-2 py-1 rounded-md font-mono">
                {activeSessionName.slice(0,17)}
              </span>

            </div>

          </div>


        </header>

        {/* Conversation Messages */}
        <ChatWindow
          threadId={activeSessionId}
          messages={messages}
          setMessages={setMessages}
        />

        {/* Input Dock */}
        <InputDock
          threadId={activeSessionId}
          onSendMessage={handleSendMessage}
          refreshThreads={setRefreshThreads}
        />

      </div>

    </div>
  );
}
