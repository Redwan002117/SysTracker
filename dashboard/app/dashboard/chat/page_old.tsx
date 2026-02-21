'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { MessageCircle, Plus, Send, User, Users, Paperclip, X } from 'lucide-react';
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
            setUsers(data.filter((u: ChatUser) => u.username !== me));
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

    useEffect(() => {
        fetchThreads();
        fetchUsers();
    }, [fetchThreads, fetchUsers]);

    useEffect(() => {
        const socket = io({
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        socketRef.current = socket;

        socket.on('chat_message', (payload: ChatMessage) => {
            setMessages(prev => {
                const existing = prev[payload.thread_id] || [];
                return { ...prev, [payload.thread_id]: [...existing, payload] };
            });
            setThreads(prev => {
                const updated = prev.map(t => {
                    if (t.id !== payload.thread_id) return t;
                    const isActive = selectedThreadRef.current === payload.thread_id;
                    const unreadCount = payload.sender !== me && !isActive ? (t.unread_count || 0) + 1 : 0;
                    const lastMessage = payload.body || (payload.attachment_name ? `Sent: ${payload.attachment_name}` : 'New message');
                    return {
                        ...t,
                        last_message: lastMessage,
                        last_message_at: payload.created_at,
                        last_attachment_name: payload.attachment_name || null,
                        unread_count: unreadCount
                    };
                });
                return updated.sort((a, b) => {
                    const aTime = a.last_message_at || a.created_at;
                    const bTime = b.last_message_at || b.created_at;
                    return bTime.localeCompare(aTime);
                });
            });

            if (payload.sender !== me && selectedThreadRef.current === payload.thread_id) {
                markThreadRead(payload.thread_id);
            }
        });

        socket.on('chat_typing', (data: { thread_id: string; username: string; is_typing: boolean }) => {
            if (!data || data.username === me) return;
            setTypingUsers(prev => {
                const current = prev[data.thread_id] || [];
                if (data.is_typing) {
                    if (current.includes(data.username)) return prev;
                    return { ...prev, [data.thread_id]: [...current, data.username] };
                }
                return { ...prev, [data.thread_id]: current.filter(u => u !== data.username) };
            });

            if (data.is_typing) {
                setTimeout(() => {
                    setTypingUsers(prev => {
                        const current = prev[data.thread_id] || [];
                        return { ...prev, [data.thread_id]: current.filter(u => u !== data.username) };
                    });
                }, 3000);
            }
        });

        socket.on('chat_read', (data: { thread_id: string; username: string }) => {
            if (data.username !== me) return;
            setThreads(prev => prev.map(t => t.id === data.thread_id ? { ...t, unread_count: 0 } : t));
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [me, markThreadRead]);

    useEffect(() => {
        if (!selectedThreadId) return;
        if (messages[selectedThreadId]) return;
        loadMessages(selectedThreadId);
    }, [selectedThreadId, messages, loadMessages]);

    useEffect(() => {
        selectedThreadRef.current = selectedThreadId;
        if (selectedThreadId) {
            markThreadRead(selectedThreadId);
        }
        setUploadFiles(null);
    }, [selectedThreadId, markThreadRead]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedThreadId, messages]);


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
            headers: {}
        });
        if (res.ok) {
            setUploadFiles(null);
            setNewMessage('');
            emitTyping(false);
        }
    };

    const sendMessage = async () => {
        if (!selectedThreadId || !newMessage.trim()) return;
        const res = await fetchWithAuth(`/api/chat/threads/${selectedThreadId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ body: newMessage })
        });
        if (res.ok) {
            setNewMessage('');
            emitTyping(false);
        }
    };

    const selectedThread = useMemo(
        () => threads.find(t => t.id === selectedThreadId) || null,
        [threads, selectedThreadId]
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-6 pt-24">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <MessageCircle className="text-blue-600" />
                        Team Chat
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowGroupModal(true)}
                            className="px-3 py-2 bg-slate-900 text-white text-sm rounded-lg flex items-center gap-1"
                        >
                            <Users size={14} />
                            New Group
                        </button>
                        <select
                            value={targetUser}
                            onChange={(e) => setTargetUser(e.target.value)}
                            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
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
                            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg flex items-center gap-1"
                        >
                            <Plus size={14} />
                            New Chat
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 font-semibold text-slate-700">Conversations</div>
                        <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
                            {loadingThreads ? (
                                <div className="p-4 text-slate-400 text-sm">Loading...</div>
                            ) : threads.length === 0 ? (
                                <div className="p-4 text-slate-400 text-sm">No conversations yet</div>
                            ) : (
                                threads.map(thread => (
                                    <button
                                        key={thread.id}
                                        onClick={() => setSelectedThreadId(thread.id)}
                                        className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${selectedThreadId === thread.id ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                                {thread.is_group ? (
                                                    <Users size={16} className="text-slate-500" />
                                                ) : thread.other_avatar ? (
                                                    <Image src={thread.other_avatar} alt="avatar" width={40} height={40} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={16} className="text-slate-500" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm truncate">
                                                    {thread.is_group ? (thread.name || 'Group Chat') : (thread.other_display_name || thread.other_username || 'Unknown')}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {thread.last_message || (thread.last_attachment_name ? `Sent: ${thread.last_attachment_name}` : 'No messages yet')}
                                                </p>
                                            </div>
                                            {!!thread.unread_count && thread.unread_count > 0 && (
                                                <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold bg-blue-600 text-white rounded-full">
                                                    {thread.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="p-4 border-b border-slate-100">
                            <h2 className="font-semibold text-slate-800">
                                {selectedThread?.is_group
                                    ? (selectedThread?.name || 'Group Chat')
                                    : (selectedThread?.other_display_name || selectedThread?.other_username || 'Select a conversation')}
                            </h2>
                            {selectedThread?.is_group && (
                                <p className="text-xs text-slate-500 mt-1">{selectedThread?.member_count || 0} members</p>
                            )}
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto max-h-[560px]">
                            {loadingMessages ? (
                                <div className="text-slate-400 text-sm">Loading messages...</div>
                            ) : selectedThreadId && messages[selectedThreadId]?.length ? (
                                <div className="space-y-3">
                                    {messages[selectedThreadId].map(msg => (
                                        <div key={msg.id} className={`flex ${msg.sender === me ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${msg.sender === me ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                                                <div className="text-[10px] opacity-70 mb-1">{msg.sender}</div>
                                                {msg.body}
                                                {msg.attachment_url && (
                                                    <div className="mt-2 space-y-2">
                                                        <a
                                                            href={msg.attachment_url}
                                                            className={`inline-flex items-center gap-2 text-xs ${msg.sender === me ? 'text-blue-100' : 'text-blue-600'}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <Paperclip size={12} />
                                                            {msg.attachment_name || 'Attachment'}
                                                        </a>
                                                        {msg.attachment_type?.startsWith('image/') && (
                                                            <div className="rounded-lg overflow-hidden border border-slate-200">
                                                                <Image src={msg.attachment_url} alt={msg.attachment_name || 'attachment'} width={320} height={200} className="w-full h-auto" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {selectedThreadId && typingUsers[selectedThreadId]?.length ? (
                                        <div className="text-xs text-slate-400">
                                            {typingUsers[selectedThreadId].join(', ')} typing...
                                        </div>
                                    ) : null}
                                    <div ref={messagesEndRef} />
                                </div>
                            ) : (
                                <div className="text-slate-400 text-sm">No messages yet</div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 space-y-3">
                            {uploadFiles && uploadFiles.length > 0 && (
                                <div className="text-xs text-slate-500">
                                    {uploadFiles.length} file(s) selected
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <label className="px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer">
                                    <Paperclip size={16} />
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
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            uploadFiles && uploadFiles.length > 0 ? sendFiles() : sendMessage();
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => (uploadFiles && uploadFiles.length > 0 ? sendFiles() : sendMessage())}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
                                    disabled={!selectedThreadId}
                                >
                                    <Send size={16} />
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showGroupModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Users size={18} /> New Group
                            </h3>
                            <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                    placeholder="Ops Team"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Members</label>
                                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-2">
                                    {users.map(u => (
                                        <label key={u.username} className="flex items-center gap-2 text-sm text-slate-600">
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
                                            />
                                            {u.display_name || u.username}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowGroupModal(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createGroup}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
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
