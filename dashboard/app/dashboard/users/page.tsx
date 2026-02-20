'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Trash2, Shield, Eye, X, AlertCircle, CheckCircle, Loader2, UserPlus } from 'lucide-react';
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
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Form state
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        role: 'viewer' as 'admin' | 'viewer'
    });
    const [creating, setCreating] = useState(false);

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
                setNewUser({ username: '', email: '', password: '', role: 'viewer' });
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-6 pt-24">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                                <Users size={32} className="text-blue-600" />
                                User Management
                            </h1>
                            <p className="text-slate-500 mt-2">Manage dashboard users and their permissions</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                        >
                            <UserPlus size={18} />
                            Add User
                        </button>
                    </div>
                </motion.div>

                {/* Users Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
                >
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold">
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
                                            <button
                                                onClick={() => setDeleteUserId(user.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="Delete user"
                                            >
                                                <Trash2 size={16} />
                                            </button>
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
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <UserPlus size={24} className="text-blue-600" />
                                    Create New User
                                </h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={creating}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X size={20} />
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

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-800"
                                        placeholder="••••••••"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Minimum 8 characters</p>
                                </div>

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
                                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {creating ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
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
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertCircle size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Delete User</h2>
                                    <p className="text-slate-600 mt-1">Are you sure you want to delete this user? This action cannot be undone.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteUserId(null)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(deleteUserId)}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
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
