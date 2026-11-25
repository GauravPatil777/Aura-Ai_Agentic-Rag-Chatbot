import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Sidebar from './features/pages/Sidebar';
import ChatWindow from './features/pages/ChatWindow';
import InputDock from './features/pages/InputDock';

import './App.css';
import { Sparkles, Loader2, UserRound } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

export default function App() {

    const [user, setUser] = useState(null);
    const [authType, setAuthType] = useState(null)
    const [authLoading, setAuthLoading] = useState(true);
    const [guestLoading, setGuestLoading] = useState(false);

    const [activeSessionId, setActiveSessionId] = useState(
        () => crypto.randomUUID()
    );

    const [activeSessionName, setActiveSessionName] = useState("New Chat");
    const [messages, setMessages] = useState([]);
    const [refreshThreads, setRefreshThreads] = useState(0);

    // Restore existing session
    useEffect(() => {

        const checkAuth = async () => {

            try {

                const response = await api.get(
                    `/auth/me`
                );
                
                setUser(response.data);
                setAuthType(response.data.auth_type)

            } catch (error) {

                if (error.response?.status !== 401) {
                    console.error("Authentication check failed:", error);
                }

                setUser(null);

            } finally {

                setAuthLoading(false);

            }

        };

        checkAuth();

    }, []);

    // Google login
    const handleGoogleLogin = () => {

        window.location.href = `${API_URL}/auth/google`;

    };

    // Guest login
    const handleGuestLogin = async () => {

        try {

            setGuestLoading(true);

            const response = await api.post(
                `/auth/guest`
            );

            setUser(response.data);
            setAuthType("guest")

        } catch (error) {

            console.error("Guest login failed:", error);

            alert(
                error.response?.data?.detail ||
                "Unable to continue as guest."
            );

        } finally {

            setGuestLoading(false);

        }

    };

    // Logout
    const handleLogout = async () => {

        try {

            await api.post(`/auth/logout`);

        } catch (error) {

            console.error("Logout failed:", error);

        } finally {

            setUser(null);
            setMessages([]);
            setActiveSessionId(crypto.randomUUID());
            setAuthType(null)
            setActiveSessionName("New Chat");

        }

    };

    // Add messages
    const handleSendMessage = (message) => {

        setMessages(prev => [...prev, message]);

    };

    // Create new conversation
    const handleNewChat = () => {

        const newThreadId = crypto.randomUUID();

        setMessages([]);
        setActiveSessionId(newThreadId);
        setActiveSessionName("New Chat");

    };

    // Open existing conversation
    const handleSelectSession = (threadId, threadName) => {

        setMessages([]);
        setActiveSessionId(threadId);
        setActiveSessionName(threadName);

    };

    // Authentication loading screen
    if (authLoading) {

        return (
            <div className="h-screen flex items-center justify-center bg-[#f8f7f4]">

                <Loader2
                    size={32}
                    className="animate-spin text-[#4a7c59]"
                />

            </div>
        );

    }

    // Login screen
    if (!user) {

        return (

            <div className="h-screen flex items-center justify-center bg-[#f8f7f4] px-5">

                <div className="w-full max-w-md bg-white border border-[#e5e3dc] rounded-2xl p-8 shadow-sm text-center">

                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#3b5e43] text-white flex items-center justify-center mb-5">

                        <Sparkles size={32} />

                    </div>

                    <h1 className="text-2xl font-bold text-[#1c241d]">
                        Welcome to AURA AI
                    </h1>

                    <p className="text-sm text-[#738375] mt-3 mb-8">
                        Your intelligent companion for conversations,
                        research, and knowledge.
                    </p>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full py-3 px-4 border border-[#d4d1c8] rounded-xl flex items-center justify-center gap-3 hover:bg-[#f8f7f4] transition-colors font-medium text-[#2d372e]"
                    >

                        {/* <Chrome size={20} /> */}

                        Continue with Google

                    </button>

                    <div className="flex items-center gap-3 my-6">

                        <div className="h-px bg-[#e5e3dc] flex-1" />

                        <span className="text-xs text-[#a0a99f]">
                            OR
                        </span>

                        <div className="h-px bg-[#e5e3dc] flex-1" />

                    </div>

                    <button
                        onClick={handleGuestLogin}
                        disabled={guestLoading}
                        className="w-full py-3 px-4 bg-[#4a7c59] hover:bg-[#3d6849] text-white rounded-xl flex items-center justify-center gap-3 transition-colors font-medium disabled:opacity-60"
                    >

                        {guestLoading ? (
                            <Loader2 size={19} className="animate-spin" />
                        ) : (
                            <UserRound size={19} />
                        )}

                        Continue as Guest

                    </button>

                    <p className="text-xs text-[#a0a99f] mt-6">
                        Sign in to access your account and saved conversations.
                    </p>

                </div>

            </div>

        );

    }

    return (

        <div className="flex h-screen w-screen bg-[#f8f7f4] font-sans overflow-hidden text-[#1c241d]">

            <Sidebar
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
                refreshThreads={refreshThreads}
                user={user}
                onLogout={handleLogout}
                authType={authType}
            />

            <div className="flex-1 flex flex-col min-w-0 h-screen">

                <header className="h-14 px-6 border-b border-[#e5e3dc] flex items-center justify-between bg-[#f8f7f4] shrink-0">

                    <div className="flex items-center gap-3 min-w-0">

                        <div className="w-8 h-8 rounded-lg bg-[#e8e6df] flex items-center justify-center shrink-0">

                            <Sparkles
                                size={17}
                                className="text-[#4a7c59]"
                            />

                        </div>

                        <div className="flex items-center gap-3 min-w-0">

                            <h1 className="text-sm font-semibold whitespace-nowrap">
                                Current Conversation
                            </h1>

                            <span className="text-[11px] bg-[#e8e5dc] px-2 py-1 rounded-md font-mono">
                                {activeSessionName.slice(0, 17)}
                            </span>

                        </div>

                    </div>

                </header>

                <ChatWindow
                    threadId={activeSessionId}
                    messages={messages}
                    setMessages={setMessages}
                />

                <InputDock
                    threadId={activeSessionId}
                    onSendMessage={handleSendMessage}
                    refreshThreads={setRefreshThreads}
                />

            </div>

        </div>

    );

}