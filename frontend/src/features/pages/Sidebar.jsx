import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

import {
    Plus,
    Search,
    MessageSquare,
    Layers,
    HardDrive,
    SlidersHorizontal,
    Terminal,
    Loader2,
    RefreshCw,
    Trash2,
    Sparkles,
    UserRound
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

export default function Sidebar({
    activeSessionId,
    onSelectSession,
    onNewChat,
    refreshThreads,
    user,
    onLogout,
    authType
}) {

    const [searchQuery, setSearchQuery] = useState('');
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingThreads, setDeletingThreads] = useState(new Set());

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Fetch saved conversations
    const fetchThreads = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get(
                `/retrieve_thread_names`
            );

            setThreads(response.data);

        } catch (error) {
            console.error("Error fetching threads:", error);
            setError("Unable to load chat history.");

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {

        if (authType !== "google") {
            setThreads([]);
            return;
        }

        fetchThreads();

    }, [authType, refreshThreads]);

    // Search conversations
    const filteredThreads = useMemo(() => {
        return threads.filter(thread =>
            thread.thread_name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase())
        );
    }, [threads, searchQuery]);

    // Group conversations by date
    const groupedThreads = useMemo(() => {

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const previous7Days = new Date(today);
        previous7Days.setDate(today.getDate() - 7);

        const groups = {
            today: [],
            yesterday: [],
            previous7Days: [],
            older: []
        };

        filteredThreads.forEach(thread => {

            const updatedAt = thread.updated_at
                ? new Date(thread.updated_at)
                : null;

            if (!updatedAt || isNaN(updatedAt.getTime())) {
                groups.older.push(thread);
                return;
            }

            if (updatedAt >= today) {
                groups.today.push(thread);
            } else if (updatedAt >= yesterday) {
                groups.yesterday.push(thread);
            } else if (updatedAt >= previous7Days) {
                groups.previous7Days.push(thread);
            } else {
                groups.older.push(thread);
            }

        });

        return groups;

    }, [filteredThreads]);

    // Delete conversation
    const handleDeleteThread = async (e, threadId) => {

        e.stopPropagation();

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this conversation?"
        );

        if (!confirmDelete) return;

        try {

            setDeletingThreads(prev =>
                new Set(prev).add(threadId)
            );

            await api.delete(
                `/delete_thread/${encodeURIComponent(threadId)}`
            );

            setThreads(prev =>
                prev.filter(thread =>
                    thread.thread_id !== threadId
                )
            );

            if (activeSessionId === threadId) {
                onNewChat?.();
            }

            console.log("Thread deleted successfully:", threadId);

        } catch (error) {

            console.error("Error deleting thread:", error);

            alert(
                error.response?.data?.detail ||
                "Failed to delete conversation."
            );

        } finally {

            setDeletingThreads(prev => {
                const updated = new Set(prev);
                updated.delete(threadId);
                return updated;
            });

        }
    };

    // Select conversation
    const handleSelectSession = (threadId, thread_name) => {
        onSelectSession?.(threadId, thread_name);
    };

    // Create new conversation
    const handleNewChat = () => {
        onNewChat?.();
    };

    // Render history group
    const renderGroup = (title, items, Icon) => {

        if (items.length === 0) return null;

        return (
            <div>

                <div className="flex justify-between items-center text-[#738375] font-semibold text-xs tracking-wider uppercase px-3 mb-2">

                    <span>{title}</span>

                    <span>{items.length}</span>

                </div>
                {items.map((thread) => {

                    const threadId = thread.thread_id;
                    const threadName = thread.thread_name;
                    const isActive = activeSessionId === threadId;

                    return (

                        <div
                            key={threadId}
                            onClick={() => handleSelectSession(threadId, threadName)}
                            title={thread.thread_name}
                            className={`group p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${isActive
                                ? 'bg-[#d8d5cb] text-[#1c241d] font-medium shadow-sm'
                                : 'hover:bg-[#dfdcd3] text-[#3d4b3f]'
                                }`}
                        >

                            <Icon
                                size={18}
                                className="shrink-0 text-[#4a7c59]"
                            />

                            <span className="truncate text-sm flex-1">
                                {thread.thread_name || "New Conversation"}
                            </span>

                            <button
                                onClick={(e) =>
                                    handleDeleteThread(e, threadId)
                                }
                                disabled={deletingThreads.has(threadId)}
                                title="Delete conversation"
                                className="shrink-0 p-2 rounded-md  hover:bg-red-100 text-[#738375] hover:text-red-600 transition-all disabled:opacity-100"
                            >

                                {deletingThreads.has(threadId) ? (
                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Trash2 size={17} />
                                )}

                            </button>

                        </div>
                    );

                })}


            </div>
        );
    };

    return (
        <>

            {/* AURA AI Sidebar */}
            <aside
                className={`${isSidebarOpen
                    ? 'w-80 border-r'
                    : 'w-0 border-r-0'
                    } bg-[#e8e6df] text-[#2d372e] flex flex-col justify-between border-[#d4d1c8] select-none h-screen shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out`}
            >

                <div className="w-80 min-w-80 h-full flex flex-col">

                    {/* AURA AI Branding */}
                    <div className="p-5 border-b border-[#dad7cd] flex items-center justify-between">

                        <div className="flex items-center gap-3">

                            <div className="w-11 h-11 rounded-xl bg-[#3b5e43] text-white flex items-center justify-center shadow-sm">

                                <Sparkles size={24} />

                            </div>

                            <div>

                                <h2 className="text-lg font-bold tracking-wide leading-tight text-[#1c241d]">
                                    AURA AI
                                </h2>

                                <p className="text-xs text-[#526355] tracking-wide mt-1">
                                    Your Intelligent Companion
                                </p>

                            </div>

                        </div>

                    </div>

                    {/* New Chat and Search */}
                    <div className="p-4 space-y-4">

                        <button
                            onClick={handleNewChat}
                            className="w-full py-3 px-4 bg-[#4a7c59] hover:bg-[#3d6849] active:scale-[0.99] text-white text-base font-medium rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                        >

                            <Plus size={19} />

                            <span>New Chat</span>

                        </button>

                        {/* Search */}
                        <div className="relative">

                            <Search
                                size={18}
                                className="absolute left-3.5 top-3 text-[#738375]"
                            />

                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-[#dedbd2] text-[#2d372e] text-sm placeholder-[#738375] rounded-xl pl-11 pr-4 py-3 outline-none border border-transparent focus:border-[#4a7c59] transition-all"
                            />

                        </div>

                    </div>

                    {/* Conversation History */}

                    {authType === "guest" ? (

                        <div className="px-4 py-8 text-center flex-1">

                            <div className="flex justify-center mb-4">
                                <MessageSquare size={28} className="text-[#8a9b8c]" />
                            </div>

                            <h3 className="text-[#273529] font-semibold text-base mb-2">
                                Save Your Conversations
                            </h3>

                            <p className="text-sm text-[#738375] leading-6 mb-5">
                                Sign in with Google to save your chat history
                                and access your previous conversations anytime.
                            </p>

                            <button
                                onClick={() => window.location.href = `${API_URL}/auth/google`}
                                className="w-full bg-[#4a7c59] hover:bg-[#3d684a] text-white py-2.5 rounded-lg text-sm font-medium transition"
                            >
                                Login with Google
                            </button>

                        </div>

                    ) : (
                        <div className="px-4 space-y-5 flex-1 min-h-0 overflow-y-auto">

                            {loading && (
                                <div className="flex items-center justify-center gap-3 py-10 text-sm text-[#738375]">

                                    <Loader2 size={20} className="animate-spin" />

                                    Loading conversations...

                                </div>
                            )}

                            {!loading && error && (
                                <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl space-y-3">

                                    <p>{error}</p>

                                    <button
                                        onClick={fetchThreads}
                                        className="flex items-center gap-2 text-[#4a7c59] font-medium"
                                    >

                                        <RefreshCw size={16} />

                                        Retry

                                    </button>

                                </div>
                            )}

                            {!loading && !error && filteredThreads.length === 0 && (
                                <div className="text-center py-10">

                                    <MessageSquare
                                        size={30}
                                        className="mx-auto mb-3 text-[#a0a99f]"
                                    />

                                    <p className="text-sm text-[#738375]">

                                        {searchQuery
                                            ? "No matching conversations"
                                            : "No conversations yet"
                                        }

                                    </p>

                                </div>
                            )}

                            {!loading && !error && (
                                <>

                                    {renderGroup(
                                        "Today",
                                        groupedThreads.today,
                                        Terminal
                                    )}

                                    {renderGroup(
                                        "Yesterday",
                                        groupedThreads.yesterday,
                                        MessageSquare
                                    )}

                                    {renderGroup(
                                        "Previous 7 Days",
                                        groupedThreads.previous7Days,
                                        Layers
                                    )}

                                    {renderGroup(
                                        "Chat History",
                                        groupedThreads.older,
                                        MessageSquare
                                    )}

                                </>
                            )}

                        </div>

                        // </div>
                    )}


                    {/* Footer */}

                    <div className="w-80 p-4 border-t border-[#dad7cd] space-y-4">

                        {/* User Profile */}
                        <div className="flex items-center gap-3">

                            {user?.picture ? (

                                <img
                                    src={user.picture}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover"
                                />

                            ) : (

                                <div className="w-10 h-10 rounded-full bg-[#3b5e43] text-white flex items-center justify-center">
                                    <UserRound size={20} />
                                </div>

                            )}

                            <div className="flex-1 min-w-0">

                                <p className="text-sm font-semibold text-[#2d372e] truncate">
                                    {user?.name || "Guest User"}
                                </p>

                                <p className="text-xs text-[#738375] truncate">
                                    {user?.email || "Guest Session"}
                                </p>

                            </div>

                            <button
                                onClick={onLogout}
                                title="Logout"
                                className="text-xs text-red-600 hover:bg-red-50 rounded-lg px-3 py-2"
                            >
                                Logout
                            </button>

                        </div>

                        {/* Conversation Information */}
                        <div className="flex items-center justify-between text-sm text-[#526355]">

                            <div className="flex items-center gap-2">

                                <HardDrive size={18} />

                                <span>
                                    {threads.length} Conversations
                                </span>

                            </div>

                            {authType === "google" && (
                                <button
                                    onClick={fetchThreads}
                                    disabled={loading}
                                    title="Refresh conversations"
                                    className="p-2 hover:bg-[#dedbd2] rounded-lg disabled:opacity-50"
                                >
                                    <RefreshCw
                                        size={17}
                                        className={loading ? "animate-spin" : ""}
                                    />
                                </button>
                            )}

                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                title="Hide sidebar"
                                className="p-2 hover:bg-[#dedbd2] rounded-lg"
                            >

                                <SlidersHorizontal size={18} />

                            </button>

                        </div>

                    </div>
                </div>
            </aside>

            {/* Reopen Sidebar */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    title="Show AURA AI sidebar"
                    className="fixed top-4 left-4 z-50 p-3 bg-[#3b5e43] text-white rounded-xl shadow-lg hover:bg-[#4a7c59] transition-all duration-200"
                >

                    <Sparkles size={20} />

                </button>
            )}

        </>
    );
}