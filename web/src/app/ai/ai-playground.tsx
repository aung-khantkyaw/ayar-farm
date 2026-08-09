'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources?: any;
  createdAt: Date;
}

export default function AIPlayground() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('token') || undefined;
      const result = await api.get('/ai-chat/history', token);
      setMessages(result.data || []);
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, []);

  const clearChatHistory = async () => {
    try {
      const token = localStorage.getItem('token') || undefined;
      await api.delete('/ai-chat/history', token);
      setMessages([]);
      setCurrentResponse('');
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);
    setCurrentResponse('');

    // Add user message to UI immediately
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: userMessage,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const token = localStorage.getItem('token') || undefined;
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/ai-chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: userMessage }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'chunk') {
                fullResponse += data.content;
                setCurrentResponse(fullResponse);
              } else if (data.type === 'done') {
                fullResponse = data.content;
                setCurrentResponse('');
                const assistantMessage: Message = {
                  id: Date.now().toString(),
                  role: 'ASSISTANT',
                  content: fullResponse,
                  createdAt: new Date(),
                };
                setMessages((prev) => [...prev, assistantMessage]);
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Chat error:', error);
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'ASSISTANT',
          content: 'Sorry, I encountered an error. Please try again.',
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentResponse('');
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Farming Assistant</h1>
                <p className="text-sm text-gray-500">Ask about farming, livestock, and breeding</p>
            </div>
            </div>
            <button
            onClick={clearChatHistory}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
            <Trash2 className="w-4 h-4" />
            Clear Chat
            </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && !isLoading && (
                <div className="text-center py-20">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Welcome to AI Farming Assistant
                </h2>
                <p className="text-gray-600 mb-6">
                    I can help you with questions about farming, livestock, and breeding based on our knowledge base.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    {[
                    'How to improve soil health?',
                    'Best pig feeding practices?',
                    'Crop disease prevention?',
                    ].map((suggestion) => (
                    <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="p-4 text-left bg-white border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
                    >
                        <p className="text-sm text-gray-700">{suggestion}</p>
                    </button>
                    ))}
                </div>
                </div>
            )}

            {messages.map((message) => (
                <div
                key={message.id}
                className={`flex gap-4 ${
                    message.role === 'USER' ? 'justify-end' : 'justify-start'
                }`}
                >
                {message.role === 'ASSISTANT' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                    </div>
                )}
                <div
                    className={`max-w-2xl rounded-2xl px-5 py-3 ${
                    message.role === 'USER'
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.sources && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Sources:</p>
                        <div className="flex flex-wrap gap-2">
                        {Array.isArray(message.sources) &&
                            message.sources.map((source: any, idx: number) => (
                            <span
                                key={idx}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                                {source.collection}
                            </span>
                            ))}
                        </div>
                    </div>
                    )}
                </div>
                </div>
            ))}

            {isStreaming && currentResponse && (
                <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-2xl rounded-2xl px-5 py-3 bg-white border border-gray-200 text-gray-900">
                    <p className="whitespace-pre-wrap">{currentResponse}</p>
                    <span className="inline-block w-2 h-5 bg-green-500 animate-pulse ml-1" />
                </div>
                </div>
            )}

            {isLoading && !isStreaming && (
                <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-2xl rounded-2xl px-5 py-3 bg-white border border-gray-200">
                    <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                </div>
                </div>
            )}

            <div ref={messagesEndRef} />
            </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
                <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about farming, livestock, or breeding..."
                className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={1}
                disabled={isLoading}
                />
                <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Send className="w-5 h-5" />
                )}
                {isLoading ? 'Sending...' : 'Send'}
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
                AI responses are based on our farming knowledge base. Answers may not be accurate.
            </p>
            </div>
        </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
