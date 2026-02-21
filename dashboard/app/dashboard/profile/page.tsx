'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../../lib/auth';
import { User, Mail, Lock, Save, AlertCircle, CheckCircle, Eye, EyeOff, Loader2, MapPin, FileText, Camera, Shuffle } from 'lucide-react';
import AvatarUpload from '../../../components/AvatarUpload';

export default function Profile() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [avatar, setAvatar] = useState('');
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const getErrorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Unknown error');

    useEffect(() => {
        // Fetch current user details including email
        const fetchProfile = async () => {
            try {
                const res = await fetchWithAuth('/api/auth/status');
                const data = await res.json();
                if (data.authenticated && data.user) {
                    setUsername(data.user.username || '');
                    setEmail(data.user.email || '');
                    setDisplayName(data.user.display_name || '');
                    setBio(data.user.bio || '');
                    setLocation(data.user.location || '');
                    setAvatar(data.user.avatar || '');
                }
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetchWithAuth('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({ 
                    email, 
                    username, 
                    display_name: displayName,
                    bio,
                    location,
                    avatar
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update profile');
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(err) });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        setLoading(true);
        setMessage(null);

        try {
            const res = await fetchWithAuth('/api/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to change password');
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(err) });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (url: string) => {
        setAvatar(url);
        // Auto-save avatar
        try {
            const res = await fetchWithAuth('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify({ 
                    email, 
                    username, 
                    display_name: displayName,
                    bio,
                    location,
                    avatar: url
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update avatar');
            setMessage({ type: 'success', text: 'Avatar updated successfully!' });
        } catch (err: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(err) });
        }
    };

    const getRandomAvatar = () => {
        const seed = Math.random().toString(36).substring(7);
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    };

    const handleRandomizeAvatar = async () => {
        const randomUrl = getRandomAvatar();
        handleAvatarUpload(randomUrl);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
                
                {/* Header Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                            <User size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                                User Profile
                            </h1>
                            <p className="text-slate-600 mt-1">Manage your account settings and security preferences.</p>
                        </div>
                    </div>
                </div>

                {/* Alert Messages */}
                {message && (
                    <div className={`mb-8 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
                        message.type === 'success' 
                            ? 'bg-green-50/80 border-green-200 text-green-800 shadow-lg shadow-green-100' 
                            : 'bg-red-50/80 border-red-200 text-red-800 shadow-lg shadow-red-100'
                    }`}>
                        <div className="mt-0.5 flex-shrink-0">
                            {message.type === 'success' ? (
                                <CheckCircle size={20} className="text-green-600" />
                            ) : (
                                <AlertCircle size={20} className="text-red-600" />
                            )}
                        </div>
                        <p className="text-sm font-medium flex-1">{message.text}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Avatar & Profile Overview Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-300 p-8">
                            <div className="flex flex-col items-center">
                                {/* Avatar */}
                                <div className="relative group mb-6">
                                    <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-blue-100 shadow-xl bg-gradient-to-br from-blue-400 to-blue-600">
                                        {avatar ? (
                                            <img
                                                src={avatar}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                onError={() => setAvatar('')}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User size={48} className="text-white" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera size={32} className="text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Avatar Actions */}
                                <div className="flex gap-2 mb-6 w-full">
                                    <AvatarUpload 
                                        currentAvatar={avatar}
                                        onUpload={handleAvatarUpload}
                                    />
                                    <button
                                        onClick={handleRandomizeAvatar}
                                        className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-slate-200 shadow-sm"
                                    >
                                        <Shuffle size={14} /> Random
                                    </button>
                                </div>

                                {/* Display Info */}
                                <div className="text-center w-full space-y-3">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">
                                            {displayName || username || 'User'}
                                        </h3>
                                        {displayName && (
                                            <p className="text-sm text-slate-500 mt-1">@{username}</p>
                                        )}
                                    </div>

                                    {bio && (
                                        <p className="text-sm text-slate-600 leading-relaxed px-2">
                                            {bio}
                                        </p>
                                    )}

                                    {location && (
                                        <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                                            <MapPin size={16} className="text-slate-400" />
                                            <span>{location}</span>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                                            <Mail size={16} className="text-slate-400" />
                                            <span className="truncate">{email || 'No email'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Details & Security Cards */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Account Details Card */}
                        <div className="group">
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-300 p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-blue-100 rounded-lg">
                                        <User size={20} className="text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">Account Information</h2>
                                </div>

                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Username Field */}
                                        <div>
                                            <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-2">
                                                Username
                                                <span className="text-blue-600 ml-1">*</span>
                                            </label>
                                            <div className="relative group/field">
                                                <input
                                                    id="username"
                                                    type="text"
                                                    value={username}
                                                    onChange={e => setUsername(e.target.value)}
                                                    placeholder="Enter your username"
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 placeholder:text-slate-400 text-slate-900"
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-blue-500 transition-colors">
                                                    <User size={18} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Display Name Field */}
                                        <div>
                                            <label htmlFor="display-name" className="block text-sm font-semibold text-slate-700 mb-2">
                                                Display Name
                                            </label>
                                            <input
                                                id="display-name"
                                                type="text"
                                                value={displayName}
                                                onChange={e => setDisplayName(e.target.value)}
                                                placeholder="Your full name"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 placeholder:text-slate-400 text-slate-900"
                                            />
                                        </div>
                                    </div>

                                    {/* Email Field */}
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                                            Email Address
                                            <span className="text-blue-600 ml-1">*</span>
                                        </label>
                                        <div className="relative group/field">
                                            <input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="example@email.com"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 placeholder:text-slate-400 text-slate-900"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-blue-500 transition-colors">
                                                <Mail size={18} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location Field */}
                                    <div>
                                        <label htmlFor="location" className="block text-sm font-semibold text-slate-700 mb-2">
                                            Location
                                        </label>
                                        <div className="relative group/field">
                                            <input
                                                id="location"
                                                type="text"
                                                value={location}
                                                onChange={e => setLocation(e.target.value)}
                                                placeholder="City, Country"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 placeholder:text-slate-400 text-slate-900"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-blue-500 transition-colors">
                                                <MapPin size={18} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio Field */}
                                    <div>
                                        <label htmlFor="bio" className="block text-sm font-semibold text-slate-700 mb-2">
                                            Bio
                                        </label>
                                        <div className="relative group/field">
                                            <textarea
                                                id="bio"
                                                value={bio}
                                                onChange={e => setBio(e.target.value)}
                                                placeholder="Tell us about yourself..."
                                                rows={4}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 placeholder:text-slate-400 text-slate-900 resize-none"
                                            />
                                            <div className="absolute top-3 right-0 pr-3 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-blue-500 transition-colors">
                                                <FileText size={18} />
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">Brief description for your profile</p>
                                    </div>

                                    {/* Save Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full mt-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none cursor-pointer"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Security Settings Card */}
                        <div className="group">
                            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-300 p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-amber-100 rounded-lg">
                                        <Lock size={20} className="text-amber-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">Security & Password</h2>
                                </div>

                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    {/* Current Password */}
                                    <div>
                                        <label htmlFor="current-password" className="block text-sm font-semibold text-slate-700 mb-2">
                                            Current Password
                                            <span className="text-blue-600 ml-1">*</span>
                                        </label>
                                        <div className="relative group/field">
                                            <input
                                                id="current-password"
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={e => setCurrentPassword(e.target.value)}
                                                placeholder="Enter current password"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:bg-white transition-all duration-200 placeholder:text-slate-400 text-slate-900 pr-11"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div>
                                        <label htmlFor="new-password" className="block text-sm font-semibold text-slate-700 mb-2">
                                            New Password
                                            <span className="text-blue-600 ml-1">*</span>
                                        </label>
                                        <div className="relative group/field">
                                            <input
                                                id="new-password"
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                placeholder="Enter new password"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:bg-white transition-all duration-200 placeholder:text-slate-400 text-slate-900 pr-11"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 mb-2">
                                            Confirm Password
                                            <span className="text-blue-600 ml-1">*</span>
                                        </label>
                                        <div className="relative group/field">
                                            <input
                                                id="confirm-password"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:bg-white transition-all duration-200 placeholder:text-slate-400 text-slate-900 pr-11"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Update Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full mt-8 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex justify-center items-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none cursor-pointer"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={18} />
                                                Update Password
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Tips */}
                <div className="mt-12 p-6 bg-blue-50/70 border border-blue-200/70 rounded-xl backdrop-blur-sm">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <AlertCircle size={18} />
                        Security Tips
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>Use a strong password with at least 8 characters, including numbers and symbols</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>Change your password regularly for better account security</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>Never share your password with anyone, including administrators</span>
                        </li>
                    </ul>
                </div>
            </div>
        </main>
    );
}
