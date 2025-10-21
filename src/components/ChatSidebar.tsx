'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Pin, Trash2, MessageCircle } from 'lucide-react';
import { Chat, getAllChats, addChat, updateChat, deleteChat, searchChats } from '@/lib/chatDB';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
  currentChatId: number | null;
  onSelectChat: (chatId: number) => void;
  onNewChat: () => void;
  onUpdateTitle: (chatId: number, title: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatSidebar({
  currentChatId,
  onSelectChat,
  onNewChat,
  onUpdateTitle,
  isOpen,
  onToggle,
}: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchChats(searchQuery).then(setFilteredChats);
    } else {
      setFilteredChats(chats);
    }
  }, [chats, searchQuery]);

  const loadChats = async () => {
    const allChats = await getAllChats();
    // Sort: pinned first, then by updatedAt desc
    const sorted = allChats.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    setChats(sorted);
  };

  const handleNewChat = async () => {
    const now = new Date();
    const newChat: Omit<Chat, 'id'> = {
      title: 'New Chat',
      messages: [
        {
          role: 'assistant',
          content: 'Hello! I\'m your AI Trading Advisor. Ask me anything about trading signals, market analysis, or strategies. How can I help you today?',
        },
      ],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    const id = await addChat(newChat);
    setChats(prev => [{ ...newChat, id }, ...prev]);
    onSelectChat(id);
    if (window.innerWidth < 768) onToggle(); // Close on mobile
  };

  const handlePinChat = async (chatId: number) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      await updateChat(chatId, { pinned: !chat.pinned });
      await loadChats(); // Reload to re-sort
    }
  };

  const handleDeleteChat = async (chatId: number) => {
    await deleteChat(chatId);
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (currentChatId === chatId) {
      onNewChat(); // Or select another chat
    }
  };

  const handleSelectChat = (chatId: number) => {
    onSelectChat(chatId);
    if (window.innerWidth < 768) onToggle(); // Close on mobile
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      'group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors',
                      currentChatId === chat.id && 'bg-indigo-50 border border-indigo-200'
                    )}
                    onClick={() => handleSelectChat(chat.id!)}
                  >
                    <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {chat.title}
                        </h3>
                        {chat.pinned && <Pin className="w-3 h-3 text-indigo-600" />}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(chat.updatedAt)}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePinChat(chat.id!);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Pin className="w-3 h-3 text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id!);
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}