'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { MessageCircle, Plus, Send, User, Users, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { fetchWithAuth, getUsername } from '../../../lib/auth';
import Image from 'next/image';

interface ChatThread {
    id: string;
    is_group: number;
    name?: string | null;
    created_at: string;
    last_message?: string | null;
    last_message_at?: string | null;
    last_attachment_name?: string | null;
    other_username?: string | null;
    other_display_name?: string | null;
    other_avatar?: string | null;
    member_count?: number;
    unread_count?: number;
}

interface ChatMessage {
    id: string;
    thread_id: string;
    sender: string;
    body: string;
    attachment_url?: string | null;
    attachment_name?: string | null;
    attachment_size?: number | null;
    attachment_type?: string | null;
    created_at: string;
}

interface ChatUser {
    username: string;
    display_name?: string | null;
    avatar?: string | null;
}

export default function ChatPage() {
    const me = getUsername();
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [targetUser, setTargetUser] = useState('');
    const [loadingThreads, setLoadingThreads] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupMembers, setGroupMembers] = useState<string[]>([]);
    const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const selectedThreadRef = useRef<string | null>(null);
    const socketRef = useRef<ReturnType<typeof io> | null>(null);

    const fetchThreads = useCallback(async () => {
        setLoadingThreads(true);
        try {
            const res = await fetchWithAuth('/api/chat/threads');
            if (!res.ok) return;
            const data = await res.json();
            setThreads(data);
            if (!selectedThreadId && data.length > 0) {
                setSelectedThreadId(data[0].id);
            }
        } finally {
            setLoadingThreads(false);
        }
    }, [selectedThreadId]);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetchWithAuth('/api/mail-users');
            if (!res.ok) return;
            const data = await res.json();
            // Filter out current user and deduplicate by username
            const filteredUsers = data.filter((u: ChatUser) => u.username !== me);
            const uniqueUsers = Array.from(
                new Map(filteredUsers.map((u: ChatUser) => [u.username, u])).values()
            ) as ChatUser[];
            setUsers(uniqueUsers);
        } catch {}
    }, [me]);

    const loadMessages = useCallback(async (threadId: string) => {
        setLoadingMessages(true);
        try {
            const res = await fetchWithAuth(`/api/chat/threads/${threadId}/messages`);
            if (!res.ok) return;
            const data = await res.json();
            setMessages(prev => ({ ...prev, [threadId]: data }));
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    const markThreadRead = useCallback(async (threadId: string) => {
        try {
            await fetchWithAuth(`/api/chat/threads/${threadId}/read`, { method: 'POST' });
            setThreads(prev => prev.map(t => t.id === threadId ? { ...t, unread_count: 0 } : t));
        } catch {}
    }, []);

    const selectedThread = useMemo(() => threads.find(t => t.id === selectedThreadId), [threads, selectedThreadId]);

    useEffect(() => {
        fetchThreads();
        fetchUsers();

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = io(apiUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket connected');
        });

        socket.on('chat_message', (data: ChatMessage) => {
            setMessages(prev => ({
                ...prev,
                [data.thread_id]: [...(prev[data.thread_id] || []), data]
            }));
            setThreads(prev => prev.map(t =>
                t.id === data.thread_id
                    ? {
                        ...t,
                        last_message: data.body,
                        last_message_at: data.created_at,
                        last_attachment_name: data.attachment_name,
                       unread_count: (t.unread_count || 0) + (selectedThreadRef.current === data.thread_id ? 0 : 1)
                    }
                    : t
            ));
        });

        socket.on('chat_typing', (data: { thread_id: string; username: string; is_typing: boolean }) => {
            setTypingUsers(prev => {
                const current = prev[data.thread_id] || [];
                if (data.is_typing) {
                    return { ...prev, [data.thread_id]: [...current.filter(u => u !== data.username), data.username] };
                } else {
                    return { ...prev, [data.thread_id]: current.filter(u => u !== data.username) };
                }
            });
        });

        socket.on('chat_read', (data: { thread_id: string }) => {
            setThreads(prev => prev.map(t => t.id === data.thread_id ? { ...t, unread_count: 0 } : t));
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchThreads, fetchUsers]);

    useEffect(() => {
        selectedThreadRef.current = selectedThreadId;
        if (selectedThreadId) {
            loadMessages(selectedThreadId);
            markThreadRead(selectedThreadId);
            setUploadFiles(null);
        }
    }, [selectedThreadId, loadMessages, markThreadRead]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedThreadId]);

    const createThread = async () => {
        if (!targetUser) return;
        const res = await fetchWithAuth('/api/chat/threads', {
            method: 'POST',
            body: JSON.stringify({ target_user: targetUser })
        });
        if (!res.ok) return;
        const data = await res.json();
        await fetchThreads();
        if (data.thread_id) {
            setSelectedThreadId(data.thread_id);
        }
        setTargetUser('');
    };

    const createGroup = async () => {
        if (!groupName.trim() || groupMembers.length === 0) return;
        const res = await fetchWithAuth('/api/chat/groups', {
            method: 'POST',
            body: JSON.stringify({ name: groupName, members: groupMembers })
        });
        if (!res.ok) return;
        const data = await res.json();
        await fetchThreads();
        if (data.thread_id) {
            setSelectedThreadId(data.thread_id);
        }
        setGroupName('');
        setGroupMembers([]);
        setShowGroupModal(false);
    };

    const emitTyping = (isTyping: boolean) => {
        if (!selectedThreadId || !socketRef.current || !me) return;
        socketRef.current.emit('chat_typing', {
            thread_id: selectedThreadId,
            username: me,
            is_typing: isTyping
        });
    };

    const sendFiles = async () => {
        if (!selectedThreadId || !uploadFiles || uploadFiles.length === 0) return;
        const formData = new FormData();
        Array.from(uploadFiles).forEach(file => formData.append('files', file));
        if (newMessage.trim()) formData.append('body', newMessage.trim());

        const res = await fetchWithAuth(`/api/chat/threads/${selectedThreadId}/upload`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Skip-Content-Type': 'true' }
        });
        if (!res.ok) return;

        setNewMessage('');
        setUploadFiles(null);
        await loadMessages(selectedThreadId);
        await fetchThreads();
        emitTyping(false);
    };

    const sendMessage = async () => {
        if (!selectedThreadId || !newMessage.trim()) return;

        const res = await fetchWithAuth(`/api/chat/threads/${selectedThreadId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ body: newMessage.trim() })
        });
        if (!res.ok) return;

        setNewMessage('');
        await loadMessages(selectedThreadId);
        await fetchThreads();
        emitTyping(false);
    };

    return (
        <div className="h-full flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
            {/* Sidebar - Glassmorphism Style */}
            <div className="w-80 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col">
                {/* Header with Gradient */}
                <div className="p-5 border-b border-slate-200/50 bg-gradient-to-br from-blue-50/70 via-purple-50/50 to-white/70">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                                <MessageCircle className="h-5 w-5 text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Chat
                            </span>
                        </h2>
                        <button
                            onClick={() => setShowGroupModal(true)}
                            className="p-2.5 bg-white/60 hover:bg-white rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 group"
                            title="Create group"
                        >
                            <Users className="h-5 w-5 text-slate-600 group-hover:text-purple-600 transition-colors duration-300" />
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        <select
                            value={targetUser}
                            onChange={(e) => setTargetUser(e.target.value)}
                            className="w-full px-3 py-3 border border-slate-200/50 rounded-xl bg-white/90 shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent cursor-pointer text-sm"
                        >
                            <option value="">Start chat with...</option>
                            {users.map(u => (
                                <option key={u.username} value={u.username}>
                                    {u.display_name || u.username}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={createThread}
                            disabled={!targetUser}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            New Chat
                        </button>
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {loadingThreads ? (
                        <div className="p-6 text-center">
                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                            <p className="mt-2 text-sm text-slate-500">Loading...</p>
                        </div>
                    ) : threads.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">
                            No conversations yet
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {threads.map(thread => (
                                <button
                                    key={thread.id}
                                    onClick={() => setSelectedThreadId(thread.id)}
                                    className={`w-full text-left p-3 rounded-xl transition-all duration-300 group ${
                                        selectedThreadId === thread.id
                                            ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-sm ring-2 ring-blue-500/20'
                                            : 'hover:bg-white/60 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shadow-sm transition-all duration-300 ${
                                            selectedThreadId === thread.id
                                                ? 'bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-blue-500/30'
                                                : 'bg-slate-100 group-hover:bg-slate-200'
                                        }`}>
                                            {thread.is_group ? (
                                                <Users size={18} className={selectedThreadId === thread.id ? 'text-white' : 'text-slate-500'} />
                                            ) : thread.other_avatar ? (
                                                <Image src={thread.other_avatar} alt="avatar" width={44} height={44} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={18} className={selectedThreadId === thread.id ? 'text-white' : 'text-slate-500'} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-slate-800 text-sm truncate">
                                                    {thread.is_group ? (thread.name || 'Group Chat') : (thread.other_display_name || thread.other_username || 'Unknown')}
                                                </p>
                                                {!!thread.unread_count && thread.unread_count > 0 && (
                                                    <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-sm">
                                                        {thread.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate mt-0.5">
                                                {thread.last_message || (thread.last_attachment_name ? `📎 ${thread.last_attachment_name}` : 'No messages')}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area - Soft UI */}
            <div className="flex-1 flex flex-col bg-white/50 backdrop-blur-sm">
                {/* Chat Header */}
                <div className="p-5 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                            {selectedThread?.is_group ? (
                                <Users size={20} className="text-white" />
                            ) : selectedThread?.other_avatar ? (
                                <Image src={selectedThread.other_avatar} alt="avatar" width={48} height={48} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <User size={20} className="text-white" />
                            )}
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 text-lg">
                                {selectedThread?.is_group
                                    ? (selectedThread?.name || 'Group Chat')
                                    : (selectedThread?.other_display_name || selectedThread?.other_username || 'Select a conversation')}
                            </h2>
                            {selectedThread?.is_group && (
                                <p className="text-xs text-slate-500">{selectedThread?.member_count || 0} members</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {loadingMessages ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                                <p className="mt-3 text-sm text-slate-500">Loading messages...</p>
                            </div>
                        </div>
                    ) : selectedThreadId && messages[selectedThreadId]?.length ? (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            {messages[selectedThreadId].map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === me ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[75%] ${msg.sender === me ? 'order-1' : 'order-2'}`}>
                                        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                                            msg.sender === me
                                                ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]'
                                                : 'bg-white text-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                                        }`}>
                                            <div className={`text-[10px] font-medium mb-1.5 ${msg.sender === me ? 'text-blue-100' : 'text-slate-500'}`}>
                                                {msg.sender}
                                            </div>
                                            {msg.body && <div className="text-sm leading-relaxed">{msg.body}</div>}
                                            {msg.attachment_url && (
                                                <div className="mt-3 space-y-2">
                                                    <a
                                                        href={msg.attachment_url}
                                                        className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-all duration-300 ${
                                                            msg.sender === me
                                                                ? 'bg-white/20 text-white hover:bg-white/30'
                                                                : 'bg-slate-100 text-blue-600 hover:bg-slate-200'
                                                        }`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        download
                                                    >
                                                        <Paperclip size={12} />
                                                        {msg.attachment_name || 'Attachment'}
                                                    </a>
                                                    {msg.attachment_type?.startsWith('image/') && (
                                                        <div className="rounded-xl overflow-hidden shadow-md max-w-sm">
                                                            <Image 
                                                                src={msg.attachment_url} 
                                                                alt={msg.attachment_name || 'image'} 
                                                                width={400} 
                                                                height={300} 
                                                                className="w-full h-auto"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`text-[10px] text-slate-400 mt-1 ${msg.sender === me ? 'text-right' : 'text-left'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {selectedThreadId && typingUsers[selectedThreadId]?.length ? (
                                <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                    <span>{typingUsers[selectedThreadId].join(', ')} typing...</span>
                                </div>
                            ) : null}
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-slate-400">
                                <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No messages yet</p>
                                <p className="text-xs mt-1">Start the conversation!</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-5 border-t border-slate-200/50 bg-white/80 backdrop-blur-xl">
                    <div className="max-w-4xl mx-auto space-y-3">
                        {uploadFiles && uploadFiles.length > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200/50">
                                <ImageIcon size={16} className="text-blue-600" />
                                <span className="text-sm text-blue-700 font-medium">
                                    {uploadFiles.length} file(s) selected
                                </span>
                                <button
                                    onClick={() => setUploadFiles(null)}
                                    className="ml-auto p-1 hover:bg-blue-200 rounded-lg transition-colors"
                                >
                                    <X size={14} className="text-blue-600" />
                                </button>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <label className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95">
                                <Paperclip size={18} className="text-slate-600" />
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => setUploadFiles(e.target.files)}
                                />
                            </label>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    emitTyping(true);
                                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                                    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1200);
                                }}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        uploadFiles && uploadFiles.length > 0 ? sendFiles() : sendMessage();
                                    }
                                }}
                                disabled={!selectedThreadId}
                            />
                            <button
                                onClick={() => (uploadFiles && uploadFiles.length > 0 ? sendFiles() : sendMessage())}
                                className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl flex items-center gap-2 shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                disabled={!selectedThreadId || (!newMessage.trim() && !uploadFiles?.length)}
                            >
                                <Send size={16} />
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Group Modal - Glassmorphism */}
            {showGroupModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                                    <Users size={20} className="text-white" />
                                </div>
                                New Group
                            </h3>
                            <button
                                onClick={() => setShowGroupModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-300"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Group Name</label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 shadow-sm"
                                    placeholder="e.g., Design Team"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Members</label>
                                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                                    {users.map(u => (
                                        <label
                                            key={u.username}
                                            className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-all duration-300 cursor-pointer group"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={groupMembers.includes(u.username)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setGroupMembers(prev => [...prev, u.username]);
                                                    } else {
                                                        setGroupMembers(prev => prev.filter(m => m !== u.username));
                                                    }
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500/50"
                                            />
                                            <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">
                                                {u.display_name || u.username}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowGroupModal(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createGroup}
                                    disabled={!groupName.trim() || groupMembers.length === 0}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Create Group
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
