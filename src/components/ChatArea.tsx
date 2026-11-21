import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatAreaProps {
  sessionId: string;
}

export default function ChatArea({ sessionId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    
    // Optimistic user message
    const tempUserMsg: Message = {
      id: Date.now().toString(),
      sessionId,
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userText })
      });
      
      if (!res.ok) throw new Error('API Error');
      
      const aiMessage = await res.json();
      // Re-fetch all to ensure sync, or just append
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Optional: Add an error message object here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 relative">
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-gray-900 to-transparent pointer-events-none z-10"></div>
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin relative z-0">
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-600/5 rounded-full blur-[60px] pointer-events-none"></div>
              <Bot size={56} className="mx-auto text-gray-700 mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
              <p className="text-gray-400">How can I help you today?</p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <div key={msg.id || i} className={clsx(
              "flex gap-4 w-full",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 shrink-0 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-cyan-400 mt-1 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                  <Bot size={18} className="drop-shadow-[0_0_3px_rgba(34,211,238,0.8)]" />
                </div>
              )}
              
              <div className={clsx(
                "max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm",
                msg.role === 'user' 
                  ? "bg-gray-800/80 text-gray-100 border border-gray-700 shadow-[0_0_15px_rgba(0,0,0,0.3)] backdrop-blur-sm" 
                  : "bg-gray-950/50 text-gray-300 border border-gray-800/80 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-md"
              )}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 hover:prose-a:drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                    <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4 w-full justify-start">
              <div className="w-8 h-8 shrink-0 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-cyan-400 mt-1 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                <Bot size={18} className="drop-shadow-[0_0_3px_rgba(34,211,238,0.8)]" />
              </div>
              <div className="bg-gray-950/50 rounded-2xl px-5 py-3.5 flex items-center gap-3 border border-gray-800/80 backdrop-blur-md">
                <Loader2 size={18} className="animate-spin text-cyan-500 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                <span className="text-sm text-gray-400">Processing...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-800 relative z-20">
        <div className="max-w-3xl mx-auto relative">
          <form onSubmit={handleSend} className="relative flex items-end gap-2 bg-gray-950/80 border border-gray-700 rounded-2xl p-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)] focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/30 focus-within:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all backdrop-blur-xl group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Message AI..."
              className="w-full bg-transparent border-0 outline-none resize-none px-3 py-2 max-h-32 min-h-[44px] text-gray-200 placeholder:text-gray-500 focus:ring-0"
              rows={1}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 shrink-0 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 disabled:opacity-50 transition-all h-11 w-11 flex items-center justify-center hover:not-disabled:border-cyan-500/50 hover:not-disabled:text-cyan-400 hover:not-disabled:shadow-[0_0_15px_rgba(34,211,238,0.25)]"
            >
              <Send size={18} className="transition-transform group-focus-within:not-disabled:text-cyan-400 group-focus-within:not-disabled:drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[11px] text-gray-500 tracking-wide uppercase">AI can make mistakes. Verify important information.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
