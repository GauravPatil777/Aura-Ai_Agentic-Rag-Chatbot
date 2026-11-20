import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import {
  Paperclip,
  Send,
  X,
  FileCode,
  Image as ImageIcon,
  Loader2,
  FileText
} from 'lucide-react';

const API_URL =import.meta.env.VITE_API_URL;

export default function InputDock({ threadId, onSendMessage, refreshThreads }) {

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [stagedFiles, setStagedFiles] = useState([]);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const loadingMessages = [
    "Understanding your question...",
    "Analyzing conversation context...",
    "Retrieving relevant documents...",
    "Running agentic workflow...",
    "Processing with language model...",
    "Generating response..."
  ];

  // Loading animation
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [loading]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height =
        `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  // Send messages to parent
  const sendToChat = (message) => {
    onSendMessage?.({
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    });
  };

  // File selection
  const handleFileSelect = async (event) => {

    const file = event.target.files?.[0];

    if (!file) return;

    if (stagedFiles.length > 0) {
      alert("Please remove the existing file before attaching another one.");
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10 MB.");
      event.target.value = '';
      return;
    }

    const fileId = crypto.randomUUID();

    const isPDF =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    const fileData = {
      id: fileId,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type,
      file,
      status: isPDF ? 'uploading' : 'attached'
    };

    setStagedFiles([fileData]);

    if (isPDF) {
      await uploadPDF(file, fileId);
    }

    event.target.value = '';
  };

  // Generate PDF context
  const uploadPDF = async (file, fileId) => {

    const formData = new FormData();

    formData.append('uploaded_file', file);
    formData.append('thread_id', threadId);

    try {

      setUploading(true);

      const response = await axios.post(
        `${API_URL}/generate_context`,
        formData
      );

      console.log("PDF context generated:", response.data);

      setStagedFiles(prev =>
        prev.map(item =>
          item.id === fileId
            ? {
                ...item,
                status: 'processed',
                context: response.data
              }
            : item
        )
      );

      sendToChat({
        type: 'system',
        text: `Successfully processed ${file.name}. Document context is ready.`,
        threadId
      });

    } catch (error) {

      console.error("PDF upload error:", error);
      console.error("Backend error:", error.response?.data);

      setStagedFiles(prev =>
        prev.map(item =>
          item.id === fileId
            ? { ...item, status: 'error' }
            : item
        )
      );

      sendToChat({
        type: 'error',
        text: `Failed to process ${file.name}. Please try uploading again.`,
        threadId
      });

    } finally {
      setUploading(false);
    }
  };

  // Remove file
  const removeFile = (fileId) => {

    if (uploading) return;

    setStagedFiles(prev =>
      prev.filter(file => file.id !== fileId)
    );
  };

  // Send message
  const handleSend = async () => {

    if (!prompt.trim() || loading || uploading) return;

    const userMessage = prompt.trim();

    sendToChat({
      type: 'human',
      text: userMessage,
      threadId
    });

    setPrompt('');
    setLoading(true);

    try {

      const response = await axios.post(
        `${API_URL}/generate_response`,
        {
          user_inp: userMessage,
          thread_id: threadId
        }
      );

      // console.log("Backend response:", response.data);

      const aiResponse = response.data["ai_response"];

      if (typeof aiResponse !== 'string') {
        throw new Error("Invalid AI response received from backend.");
      }

      sendToChat({
        type: 'ai',
        text: aiResponse,
        threadId
      });

      refreshThreads?.(prev => prev + 1);

    } catch (error) {

      console.error("Error sending message:", error);
      console.error("Backend error:", error.response?.data);

      sendToChat({
        type: 'error',
        text:
          error.response?.data?.detail ||
          error.message ||
          "Something went wrong. Please try again.",
        threadId
      });

    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="px-4 py-3 bg-[#f8f7f4] border-t border-[#e5e2d8]">

      <div className="max-w-5xl mx-auto space-y-2">

        {/* Thread Information */}
        <div className="flex justify-between items-center px-1">

          {/* <span className="text-[11px] text-[#738375]">
            Thread: {threadId?.slice(0, 8) || 'New conversation'}
          </span> */}

          {uploading && (
            <span className="text-xs text-[#4a7c59] flex items-center gap-1.5">
              <Loader2 size={13} className="animate-spin" />
              Processing document...
            </span>
          )}

        </div>

        {/* Compact Attached File */}
        {stagedFiles.length > 0 && (

          <div className="flex flex-wrap gap-2">

            {stagedFiles.map(file => (

              <div
                key={file.id}
                className="flex items-center gap-2 bg-[#eae7de] border border-[#d6d3c8] px-2.5 py-1.5 rounded-lg text-xs max-w-[240px]"
              >

                {file.name.toLowerCase().endsWith('.pdf') ? (
                  <FileText size={16} className="text-red-600 shrink-0" />
                ) : file.type.startsWith('image/') ? (
                  <ImageIcon size={16} className="text-[#4a7c59] shrink-0" />
                ) : (
                  <FileCode size={16} className="text-[#3b5e43] shrink-0" />
                )}

                <div className="flex flex-col min-w-0">

                  <span className="font-medium truncate">
                    {file.name}
                  </span>

                  <span className="text-[10px] text-[#738375]">
                    {file.status === 'uploading' && 'Uploading...'}
                    {file.status === 'processed' && 'Context ready ✓'}
                    {file.status === 'attached' && 'Attached'}
                    {file.status === 'error' && 'Upload failed'}
                  </span>

                </div>

                <button
                  onClick={() => removeFile(file.id)}
                  disabled={uploading}
                  className="p-1 hover:bg-[#dedbd0] rounded-md disabled:opacity-40 shrink-0"
                  title="Remove file"
                >
                  <X size={14} />
                </button>

              </div>

            ))}

          </div>

        )}

        {/* Loading Indicator */}
        {loading && (

          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#eae7de] rounded-xl border border-[#d6d3c8]">

            <Loader2
              size={19}
              className="animate-spin text-[#4a7c59]"
            />

            <div>

              <p className="text-sm font-semibold text-[#2c392e]">
                AURA is thinking...
              </p>

              <p className="text-xs text-[#738375]">
                {loadingMessages[loadingStep]}
              </p>

            </div>

          </div>

        )}

        {/* Compact Input Container */}
        <div className="bg-[#edeae1] border border-[#d6d3c8] rounded-2xl px-3 py-2 shadow-sm focus-within:border-[#4a7c59] transition-all">

          {/* Input Row */}
          <div className="flex items-center gap-2">

            {/* Attachment Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.json,.txt,.csv,.py"
              hidden
              onChange={handleFileSelect}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={
                uploading ||
                loading ||
                stagedFiles.length > 0
              }
              title="Attach PDF or file"
              className="shrink-0 p-2.5 text-[#4a584c] hover:bg-[#e1ded4] rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Paperclip size={19} />
            </button>

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={prompt}
              disabled={loading || uploading}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message AURA..."
              className="flex-1 min-w-0 bg-transparent text-sm text-[#1c241d] placeholder-[#7d8c7f] outline-none resize-none leading-6 py-2 max-h-[120px] overflow-y-auto"
            />

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={
                loading ||
                uploading ||
                !prompt.trim()
              }
              title="Send message"
              className="shrink-0 bg-[#4a7c59] hover:bg-[#3d6849] disabled:opacity-50 text-white p-3 rounded-xl flex items-center justify-center transition-all"
            >

              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}

            </button>

          </div>

          {/* Bottom Toolbar */}
          <div className="flex justify-between items-center border-t border-[#dedbd0]/70 mt-1 pt-2 px-2">

            <span className="text-[10px] text-[#738375]">
              AURA AI • Agentic RAG
            </span>

            <div className="flex items-center gap-2">

              <span className="text-[10px] text-[#4a7c59] font-medium">
                {uploading
                  ? 'Processing PDF'
                  : loading
                    ? 'Agent working'
                    : 'Ready'}
              </span>

              <span className="text-[10px] text-[#738375] hidden sm:inline">
                Enter to send · Shift + Enter for new line
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
