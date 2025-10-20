'use client';

import { useState } from 'react';
import { Streamdown } from 'streamdown';
import { callA0LLM } from '@/lib/a0llm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

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

      let newMessages = [...messages, userMessage, { role: 'assistant', content: '' }];
      setMessages(newMessages);

      await callA0LLM(conversation as Message[], {
        temperature: 0.7,
        stream: true,
        onToken: (token: string) => {
          newMessages[newMessages.length - 1].content += token;
          setMessages([...newMessages]);
        },
      });

      setMessages(newMessages);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-8">AI Trading Advisor</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6 max-h-96 overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <Streamdown>{msg.content}</Streamdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-left mb-4">
              <div className="inline-block px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                Thinking...
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about trading signals, strategies, or market analysis..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>

        {/* Market Insights Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-indigo-600 mb-4">🚀 AI Market Insights</h2>
          <p className="text-gray-600 mb-4">Get real-time AI-powered market analysis based on current crypto and forex data.</p>
          <button
            onClick={getMarketInsights}
            disabled={insightsLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 mb-4"
          >
            {insightsLoading ? 'Generating Insights...' : 'Get Market Insights'}
          </button>
          {insights && (
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
              <h3 className="font-semibold text-lg mb-2">Current Market Analysis</h3>
              <Streamdown>{insights}</Streamdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}