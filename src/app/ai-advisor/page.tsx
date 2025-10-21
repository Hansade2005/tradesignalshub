'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { callA0LLM, Message } from '@/lib/a0llm';

export default function AIAdvisor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI Trading Advisor. Ask me anything about trading signals, market analysis, or strategies. How can I help you today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const conversation = [
        {
          role: 'system',
          content: 'You are an expert AI trading advisor with deep knowledge of crypto and forex markets. Provide accurate, helpful advice on signals, strategies, and market analysis. Be concise and professional.',
        },
        ...messages,
        userMessage,
      ];

      let newMessages: Message[] = [...messages, userMessage, { role: 'assistant', content: '' }];
      setMessages(newMessages);

      const response = await callA0LLM(conversation as Message[], {
        stream: false,
        temperature: 0.7,
      });

      newMessages[newMessages.length - 1].content = response.completion;
      setMessages([...newMessages]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getMarketInsights = async () => {
    setInsightsLoading(true);
    try {
      const response = await fetch('/api/insights');
      if (!response.ok) {
        throw new Error('Failed to get insights');
      }
      const data = await response.json();
      setInsights(data.insights);
    } catch (error) {
      console.error('Error:', error);
      setInsights('Sorry, I encountered an error while fetching market insights. Please try again.');
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 relative ">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
        <h1 className="text-lg md:text-xl font-semibold text-gray-900">AI Trading Advisor</h1>
        <p className="text-sm text-gray-600">Ask about signals, strategies, and market analysis</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white ml-12'
                  : 'bg-white text-gray-800 mr-12 border border-gray-200'
              }`}>
                <div className={`${msg.role === 'user' ? 'prose prose-invert' : 'prose'} prose-sm max-w-none`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre: ({ children, ...props }) => (
                        <pre className={`${msg.role === 'user' ? 'bg-gray-700' : 'bg-gray-100'} p-2 rounded-md`} {...props}>
                          {children}
                        </pre>
                      ),
                      code: ({ className, children, ...props }) => (
                        <code className={`${className || ''} ${msg.role === 'user' ? 'bg-gray-700' : 'bg-gray-100'} px-1 py-0.5 rounded text-xs`} {...props}>
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {/* Market Insights Button */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <button
                onClick={getMarketInsights}
                disabled={insightsLoading}
                className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {insightsLoading ? 'Generating Insights...' : '🚀 Get Market Insights'}
              </button>
              {insights && (
                <div className="mt-2 bg-gray-50 p-3 rounded-lg border-l-4 border-indigo-500">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{insights}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 mr-12 px-4 py-3 rounded-2xl border border-gray-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 md:px-6">
        <div className="max-w-4xl mx-auto flex gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about trading signals, strategies, or market analysis..."
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
              disabled={loading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}