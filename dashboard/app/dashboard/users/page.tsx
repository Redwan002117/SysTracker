'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Trash2, Shield, Eye, X, AlertCircle, CheckCircle, Loader2, UserPlus, Mail, Send, Edit2 } from 'lucide-react';
import { fetchWithAuth, isAdmin } from '../../../lib/auth';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    created_at: string;
}

export default function UserManagement() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Form state
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        role: 'viewer' as 'admin' | 'viewer',
        sendSetupEmail: false
    });
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [sendingSetup, setSendingSetup] = useState<number | null>(null);

    // Check admin access
    useEffect(() => {
        if (!isAdmin()) {
            router.push('/dashboard');
            return;
        }
        loadUsers();
    }, [router]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await fetchWithAuth('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const response = await fetchWithAuth('/api/users', {
                method: 'POST',
                body: JSON.stringify(newUser)
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('success', `User "${newUser.username}" created successfully`);
                setShowCreateModal(false);
                setNewUser({ username: '', email: '', password: '', role: 'viewer', sendSetupEmail: false });
                loadUsers();
            } else {
                showNotification('error', data.error || 'Failed to create user');
            }
        } catch (error) {
            showNotification('error', 'Network error. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    const handleSendPasswordSetup = async (userId: number) => {
        setSendingSetup(userId);
        try {
            const response = await fetchWithAuth(`/api/users/${userId}/send-password-setup`, {
                method: 'POST'
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('success', 'Password setup email sent successfully');
            } else {
                showNotification('error', data.error || 'Failed to send email');
            }
        } catch (error) {
            showNotification('error', 'Network error. Please try again.');
        } finally {
            setSendingSetup(null);
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        
        setUpdating(true);
        try {
            const response = await fetchWithAuth(`/api/users/${editingUser.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    username: editingUser.username,
                    email: editingUser.email,
                    role: editingUser.role
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('success', `User "${editingUser.username}" updated successfully`);
                setShowEditModal(false);
                setEditingUser(null);
                loadUsers();
            } else {
                showNotification('error', data.error || 'Failed to update user');
            }
        } catch (error) {
            showNotification('error', 'Network error. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        try {
            const response = await fetchWithAuth(`/api/users/${userId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('success', 'User deleted successfully');
                setDeleteUserId(null);
                loadUsers();
            } else {
                showNotification('error', data.error || 'Failed to delete user');
            }
        } catch (error) {
            showNotification('error', 'Network error. Please try again.');
        }
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const getRoleBadgeClass = (role: string) => {
        return role === 'admin'
            ? 'bg-blue-100 text-blue-700 border-blue-200'
            : 'bg-slate-100 text-slate-600 border-slate-200';
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-purple-50/30 p-6 pt-24">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/25">
                                <Users size={28} className="text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    User Management
                                </h1>
                                <p className="text-slate-500 mt-1">Manage dashboard users and their permissions</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105 shadow-md"
                        >
                            <UserPlus size={18} strokeWidth={2.5} />
                            Add User
                        </button>
                    </div>
                </motion.div>

                {/* Users Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/20 overflow-hidden"
                >
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-blue-500" size={32} strokeWidth={2.5} />
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-linear-to-r from-blue-50/50 to-purple-50/50 border-b border-slate-200/60">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/60">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-linear-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-200 group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-linear-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-blue-600 font-semibold group-hover:scale-110 transition-transform duration-200">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-slate-800">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeClass(user.role)}`}>
                                                {user.role === 'admin' ? <Shield size={12} /> : <Eye size={12} />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                                    title="Edit user"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleSendPasswordSetup(user.id)}
                                                    disabled={sendingSetup === user.id}
                                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Send password setup email"
                                                >
                                                    {sendingSetup === user.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Mail size={16} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteUserId(user.id)}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    title="Delete user"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!loading && users.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No users found</p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Create User Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => !creating && setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.12)] border border-white/20 max-w-md w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                                    <UserPlus size={24} strokeWidth={2.5} />
                                    Create New User
                                </h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={creating}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-200 hover:scale-110"
                                >
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUser.username}
                                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800"
                                        placeholder="johndoe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="sendSetupEmail"
                                        checked={newUser.sendSetupEmail}
                                        onChange={(e) => setNewUser({ ...newUser, sendSetupEmail: e.target.checked, password: e.target.checked ? '' : newUser.password })}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <label htmlFor="sendSetupEmail" className="text-sm text-slate-700 flex items-center gap-2">
                                        <Send size={14} className="text-blue-600" />
                                        Send password setup email to user
                                    </label>
                                </div>

                                {!newUser.sendSetupEmail && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                                        <input
                                            type="password"
                                            required={!newUser.sendSetupEmail}
                                            minLength={8}
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800"
                                            placeholder="••••••••"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Minimum 8 characters</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'viewer' })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800"
                                    >
                                        <option value="viewer">Viewer - Read-only access</option>
                                        <option value="admin">Admin - Full access</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        disabled={creating}
                                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100/60 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 px-4 py-2.5 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02]"
                                    >
                                        {creating ? (
                                            <>
                                                <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create User'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit User Modal */}
            <AnimatePresence>
                {showEditModal && editingUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => !updating && setShowEditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.12)] border border-white/20 max-w-md w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                                    <Edit2 size={24} strokeWidth={2.5} />
                                    Edit User
                                </h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    disabled={updating}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-all duration-200 hover:scale-110"
                                >
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingUser.username}
                                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800"
                                        placeholder="johndoe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={editingUser.email}
                                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                                    <select
                                        value={editingUser.role}
                                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800"
                                    >
                                        <option value="viewer">Viewer - Read-only access</option>
                                        <option value="admin">Admin - Full access</option>
                                    </select>
                                </div>

                                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                                    <div className="flex items-start gap-2">
                                        <Mail size={16} className="text-purple-600 shrink-0 mt-0.5" />
                                        <div className="text-xs text-slate-700">
                                            <p className="font-semibold mb-1">Need to reset password?</p>
                                            <p>Use the "Send password setup email" button from the user list to let them set a new password.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        disabled={updating}
                                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100/60 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="flex-1 px-4 py-2.5 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02]"
                                    >
                                        {updating ? (
                                            <>
                                                <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            'Update User'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteUserId !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setDeleteUserId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.12)] border border-white/20 max-w-md w-full p-6"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 bg-linear-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center shrink-0">
                                    <AlertCircle size={24} className="text-red-600" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold bg-linear-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">Delete User</h2>
                                    <p className="text-slate-600 mt-1">Are you sure you want to delete this user? This action cannot be undone.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteUserId(null)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100/60 transition-all duration-200 hover:scale-[1.02]"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(deleteUserId)}
                                    className="flex-1 px-4 py-2.5 bg-linear-to-r from-red-600 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-200 hover:scale-[1.02]"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        className={`fixed top-8 left-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border max-w-md ${
                            notification.type === 'success'
                                ? 'bg-emerald-500 text-white border-emerald-400'
                                : 'bg-red-500 text-white border-red-400'
                        }`}
                    >
                        {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span className="font-medium">{notification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
