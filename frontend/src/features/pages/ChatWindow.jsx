import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, MessageSquare } from 'lucide-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

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

                const response = await api.get(
                    `/get_thread_history/${encodeURIComponent(threadId)}`
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


    if (!threadId || loading) {
        return (
            <div className="flex-1 min-h-0 flex items-center justify-center text-[#526355] text-base">

                {!threadId ? (
                    <>
                        <MessageSquare size={24} className="mr-3" />
                        Select a conversation to view messages.
                    </>
                ) : (
                    <>
                        <Loader2 size={24} className="animate-spin mr-3" />
                        Loading conversation...
                    </>
                )}

            </div>
        );
    }


    return (
        <div className="flex-1 min-h-0 h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 space-y-6">

            {messages.length === 0 ? (

                <div className="min-h-full flex flex-col items-center justify-center text-center px-4">

                    <div className="w-16 h-16 rounded-2xl bg-[#4a7c59] flex items-center justify-center mb-6 shadow-md">
                        <MessageSquare size={30} className="text-white" />
                    </div>

                    <h1 className="text-3xl font-semibold text-[#273529] mb-3">
                        Welcome to Aura AI
                    </h1>

                    <p className="text-[#738375] text-base max-w-md leading-7">
                        Your AI-powered research assistant. Ask questions, explore documents,
                        and discover insights through intelligent conversations.
                    </p>

                    <p className="mt-8 text-sm text-[#738375]">
                        Start a conversation by typing your message below.
                    </p>

                </div>

            ) : (

                messages.map((msg, index) => (

                    <div
                        key={msg.id || index}
                        className={`flex ${msg.type === 'human' ? 'justify-end' : 'justify-start'}`}
                    >

                        <div
                            className={`markdown-content max-w-[90%] sm:max-w-[80%] px-4 sm:px-6 py-4 sm:py-5 rounded-2xl text-base leading-7 shadow-sm ${
                                msg.type === 'human'
                                    ? 'bg-[#4a7c59] text-white rounded-br-sm'
                                    : 'bg-white/70 text-[#273529] border border-[#ece9e1] rounded-bl-sm'
                            }`}
                        >

                            {msg.type === 'human' ? (
                                <div className="whitespace-pre-wrap wrap-break-word">
                                    {msg.text}
                                </div>
                            ) : (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.text || ''}
                                </ReactMarkdown>
                            )}

                        </div>

                    </div>

                ))

            )}

        </div>
    );
}