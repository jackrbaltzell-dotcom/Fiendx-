import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, MessageSquare, ArrowLeft, CheckCheck, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Conversation, Message } from '../types';
import { dbService } from '../services/dbService';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: {
    uid: string;
    fullName: string;
    username: string;
    photoURL?: string;
  } | null;
  listingContext?: {
    id: string;
    title: string;
  } | null;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  targetUser,
  listingContext,
}) => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to user's conversations
  useEffect(() => {
    if (!user || !isOpen) return;

    const unsubscribe = dbService.subscribeConversations(user.uid, (convs) => {
      setConversations(convs);
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  // Handle direct targetUser initiation
  useEffect(() => {
    if (!user || !profile || !targetUser || !isOpen) return;

    const initConv = async () => {
      const convId = await dbService.getOrCreateConversation(
        user.uid,
        targetUser.uid,
        {
          fullName: profile.fullName,
          username: profile.username,
          photoURL: profile.photoURL,
        },
        {
          fullName: targetUser.fullName,
          username: targetUser.username,
          photoURL: targetUser.photoURL,
        },
        listingContext ? { id: listingContext.id, title: listingContext.title } : undefined
      );
      setActiveConvId(convId);
    };

    initConv();
  }, [user, profile, targetUser, listingContext, isOpen]);

  // Subscribe to messages in active conversation
  useEffect(() => {
    if (!activeConvId || !isOpen) return;

    const unsubscribe = dbService.subscribeMessages(activeConvId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [activeConvId, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId || !user || !profile) return;

    const textToSend = inputText.trim();
    setInputText('');
    await dbService.sendMessage(activeConvId, user.uid, profile.fullName, textToSend);
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherParticipant = activeConv
    ? Object.entries(activeConv.participantDetails).find(([id]) => id !== user?.uid)?.[1]
    : targetUser;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            {activeConvId && (
              <button
                type="button"
                onClick={() => setActiveConvId(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg mr-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm">
                {activeConvId
                  ? otherParticipant?.fullName || 'Conversation'
                  : 'Direct Messages'}
              </h3>
              {activeConvId && otherParticipant?.username && (
                <p className="text-[11px] text-slate-400">@{otherParticipant.username}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Listing context notice if inquiring about item */}
        {activeConv?.listingTitle && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
            <span className="truncate">Inquiring about: <b>{activeConv.listingTitle}</b></span>
          </div>
        )}

        {/* Content */}
        {!activeConvId ? (
          // Conversations List
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Connect with sellers, service providers, or clients from any listing or profile.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = Object.entries(conv.participantDetails).find(([id]) => id !== user?.uid)?.[1];
                const unread = user ? conv.unreadCount?.[user.uid] || 0 : 0;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className="p-3.5 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors"
                  >
                    <img
                      src={
                        other?.photoURL ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.username || 'user'}`
                      }
                      alt={other?.fullName || 'User'}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {other?.fullName || 'User'}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(conv.lastMessageTimestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                    </div>
                    {unread > 0 && (
                      <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // Active Chat View
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8">
                  Start the conversation! Say hello or ask for details.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 px-1 flex items-center gap-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {isMe && <CheckCheck className="w-3 h-3 text-blue-500" />}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
