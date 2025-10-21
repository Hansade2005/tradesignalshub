'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { callA0LLM, Message } from '@/lib/a0llm';
import { useTheme } from '@/hooks';
import ChatSidebar from '@/components/ChatSidebar';
import { Menu } from 'lucide-react';
import { getAllChats, getChat, updateChat, addChat } from '@/lib/chatDB';

export default function AIAdvisor() {
  const { resolvedTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Trading Advisor. Ask me anything about trading signals, market analysis, or strategies. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cryptoData, setCryptoData] = useState<any[]>([]);
  const [forexData, setForexData] = useState<any>(null);
  const [cryptoSignals, setCryptoSignals] = useState<any[]>([]);
  const [forexSignals, setForexSignals] = useState<any[]>([]);
  const [marketDataLoading, setMarketDataLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const cryptoResponse = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false');
        const cryptoDataFetched = await cryptoResponse.json();
        setCryptoData(cryptoDataFetched);

        const forexResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const forexDataFetched = await forexResponse.json();
        setForexData(forexDataFetched);

        // Fetch signals
        const cryptoSignalsResponse = await fetch('/api/crypto');
        const cryptoSignalsFetched = await cryptoSignalsResponse.json();
        setCryptoSignals(cryptoSignalsFetched.signals || []);

        const forexSignalsResponse = await fetch('/api/forex');
        const forexSignalsFetched = await forexSignalsResponse.json();
        setForexSignals(forexSignalsFetched.signals || []);
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setMarketDataLoading(false);
      }
    };
    fetchMarketData();
  }, []);

  useEffect(() => {
    const initChat = async () => {
      const chats = await getAllChats();
      if (chats.length > 0) {
        // Select the most recent chat
        const latestChat = chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
        setCurrentChatId(latestChat.id!);
        setMessages(latestChat.messages as Message[]);
      } else {
        // Create initial chat
        const now = new Date();
        const newChat = {
          title: 'New Chat',
          messages: messages,
          pinned: false,
          createdAt: now,
          updatedAt: now,
        };
        const id = await addChat(newChat);
        setCurrentChatId(id);
      }
    };
    initChat();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Update title if it's a new chat
    if (currentChatId) {
      const chat = await getChat(currentChatId);
      if (chat && chat.title === 'New Chat') {
        const title = input.slice(0, 50) + (input.length > 50 ? '...' : '');
        await updateChat(currentChatId, { title });
      }
    }

    try {
      const cryptoInfo = cryptoData.length > 0
        ? cryptoData.map((coin: any) => `${coin.name} (${coin.symbol.toUpperCase()}): ${coin.current_price}, 24h change: ${coin.price_change_percentage_24h.toFixed(2)}%`).join('\\n')
        : 'Loading crypto data...';

      const forexInfo = forexData
        ? Object.entries(forexData.rates).slice(0, 10).map(([pair, rate]: [string, any]) => `${pair}: ${rate}`).join('\\n')
        : 'Loading forex data...';

      const cryptoSignalsInfo = cryptoSignals.length > 0
        ? cryptoSignals.map((signal: any) => `${signal.symbol}: ${signal.type} (${signal.confidence}%), Take Profit: ${signal.takeProfit}, Stop Loss: ${signal.stopLoss}`).join('\\n')
        : 'Loading crypto signals...';

      const forexSignalsInfo = forexSignals.length > 0
        ? forexSignals.slice(0, 10).map((signal: any) => `${signal.symbol}: ${signal.type} (${signal.confidence}%), Take Profit: ${signal.takeProfit}, Stop Loss: ${signal.stopLoss}`).join('\\n')
        : 'Loading forex signals...';

      const systemContent = `You are an expert AI trading advisor with deep knowledge of crypto and forex markets. Provide accurate, helpful advice on signals, strategies, and market analysis. Be concise and professional. When users ask for signals, provide stop loss and take profit levels based on the available data.

Current Crypto Data (top 10 by market cap):
${cryptoInfo}

Current Forex Data (major pairs rates):
${forexInfo}

Current Crypto Signals (top 10):
${cryptoSignalsInfo}

Current Forex Signals (sample of 10):
${forexSignalsInfo}`;

      const conversation = [
        {
          role: 'system',
          content: systemContent,
        },
        ...newMessages,
      ];

      let updatedMessages = [...newMessages, { role: 'assistant' as const, content: '' }];
      setMessages(updatedMessages);

      const response = await callA0LLM(conversation as Message[], {
        stream: false,
        temperature: 0.7,
      });

      updatedMessages[updatedMessages.length - 1].content = response.completion;
      setMessages(updatedMessages);

      // Save to DB
      if (currentChatId) {
        await updateChat(currentChatId, { messages: updatedMessages });
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      const errorMessages = [...messages, errorMessage];
      setMessages(errorMessages);
      if (currentChatId) {
        await updateChat(currentChatId, { messages: errorMessages });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSelectChat = async (chatId: number) => {
    const chat = await getChat(chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages as Message[]);
    }
  };

  const handleNewChat = async () => {
    const now = new Date();
    const newChat = {
      title: 'New Chat',
      messages: [
        {
          role: 'assistant',
          content: "Hello! I'm your AI Trading Advisor. Ask me anything about trading signals, market analysis, or strategies. How can I help you today?",
        },
      ],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    const id = await addChat(newChat);
    setCurrentChatId(id);
    setMessages(newChat.messages as Message[]);
  };

  const handleUpdateTitle = async (chatId: number, title: string) => {
    await updateChat(chatId, { title });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onUpdateTitle={handleUpdateTitle}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">AI Trading Advisor</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
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
                        code: ({ node, inline, className, children, ...props }) => {
                          const match = /language-(\\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={resolvedTheme === 'dark' ? oneDark : oneLight}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={`${className || ''} ${msg.role === 'user' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} px-1 py-0.5 rounded text-xs`} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

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

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 md:px-6">
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
    </div>
  );
}