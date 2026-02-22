'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../../lib/auth';
import { User, Mail, Lock, Save, AlertCircle, CheckCircle, Eye, EyeOff, Loader2, MapPin, FileText, Camera, Shuffle, ImageIcon } from 'lucide-react';
import AvatarUpload from '../../../components/AvatarUpload';
import { fetchGravatar } from '../../../lib/gravatar';

export default function Profile() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [avatar, setAvatar] = useState('');
    const [hasPassword, setHasPassword] = useState(true); // Track if user has password set
    const [googleLinked, setGoogleLinked] = useState(false); // Track if Google account is linked
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [loadingGravatar, setLoadingGravatar] = useState(false);
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
                    // Check auth methods using safe boolean flags from server
                    setHasPassword(data.user.has_password === 1 || data.user.has_password === true);
                    setGoogleLinked(data.user.has_google === 1 || data.user.has_google === true);
                    
                    // Auto-fetch Gravatar if no avatar and user has email
                    if (!data.user.avatar && data.user.email) {
                        fetchGravatar(data.user.email, 200).then(gravatarUrl => {
                            if (gravatarUrl) {
                                setAvatar(gravatarUrl);
                            }
                        }).catch(() => {});
                    }
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
            
            // Trigger profile refresh across all components
            if (typeof window !== 'undefined') {
                localStorage.removeItem('systracker_profile');
                window.dispatchEvent(new CustomEvent('profile-updated', { 
                    detail: { display_name: displayName, email, location, avatar } 
                }));
            }
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
        
        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
            return;
        }
        
        setLoading(true);
        setMessage(null);

        try {
            const body: { current_password?: string; new_password: string } = {
                new_password: newPassword
            };
            
            // Only include current_password if user has existing password
            if (hasPassword && currentPassword) {
                body.current_password = currentPassword;
            }
            
            const res = await fetchWithAuth('/api/auth/change-password', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to change password');
            
            setMessage({ type: 'success', text: data.message || 'Password updated successfully!' });
            setHasPassword(true); // User now has a password
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
            
            // Trigger profile refresh across all components
            if (typeof window !== 'undefined') {
                localStorage.removeItem('systracker_profile');
                window.dispatchEvent(new CustomEvent('profile-updated', { detail: { avatar: url } }));
            }
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

    const handleFetchGravatar = async () => {
        if (!email) {
            setMessage({ type: 'error', text: 'Email address required for Gravatar' });
            return;
        }
        
        setLoadingGravatar(true);
        try {
            const gravatarUrl = await fetchGravatar(email, 200);
            if (gravatarUrl) {
                await handleAvatarUpload(gravatarUrl);
                setMessage({ type: 'success', text: 'Gravatar loaded successfully!' });
            } else {
                setMessage({ type: 'error', text: 'No Gravatar found for this email' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to fetch Gravatar' });
        } finally {
            setLoadingGravatar(false);
        }
    };

    return (
        <main className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-purple-50/30">\n
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
                
                {/* Header Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/25">
                            <User size={28} className="text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                User Profile
                            </h1>
                            <p className="text-slate-600 mt-1">Manage your account settings and security preferences.</p>
                        </div>
                    </div>
                </div>

                {/* Alert Messages */}
                {message && (
                    <div className={`mb-8 p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
                        message.type === 'success' 
                            ? 'bg-emerald-50/90 border-emerald-200/60 text-emerald-800 shadow-[0_8px_32px_rgba(16,185,129,0.15)]' 
                            : 'bg-red-50/90 border-red-200/60 text-red-800 shadow-[0_8px_32px_rgba(239,68,68,0.15)]'
                    }`}>
                        <div className="mt-0.5 shrink-0">
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
                        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.12)] transition-all duration-300 p-8 group">
                            <div className="flex flex-col items-center">
                                {/* Avatar */}
                                <div className="relative group/avatar mb-6">
                                    <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-blue-500/20 group-hover/avatar:ring-purple-500/30 shadow-xl bg-linear-to-br from-blue-500 to-purple-600 transition-all duration-300">
                                        {avatar ? (
                                            <img
                                                src={avatar}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                onError={() => setAvatar('')}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User size={48} className="text-white" strokeWidth={2} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera size={32} className="text-white" strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </div>

                                {/* Avatar Actions */}
                                <div className="flex flex-col gap-2 mb-6 w-full">
                                    <div className="flex gap-2">
                                        <AvatarUpload 
                                            currentAvatar={avatar}
                                            onUpload={handleAvatarUpload}
                                        />
                                        <button
                                            onClick={handleRandomizeAvatar}
                                            className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-slate-200 shadow-sm"
                                            title="Generate random avatar"
                                        >
                                            <Shuffle size={14} /> Random
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleFetchGravatar}
                                        disabled={!email || loadingGravatar}
                                        className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                        title="Fetch avatar from Gravatar based on your email"
                                    >
                                        {loadingGravatar ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <ImageIcon size={14} />
                                        )}
                                        {loadingGravatar ? 'Loading...' : 'Fetch from Gravatar'}
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
                        <div className="group/card">
                            <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.12)] transition-all duration-300 p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-linear-to-br from-blue-100 to-purple-100 rounded-xl group-hover/card:scale-110 transition-transform duration-200">
                                        <User size={20} className="text-blue-600" strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Account Information</h2>
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
                                        className="w-full mt-8 bg-linear-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-500/30 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex justify-center items-center gap-2 shadow-md disabled:shadow-none cursor-pointer hover:scale-[1.02]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} strokeWidth={2.5} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Security Settings Card */}
                        <div className="group/card">
                            <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(251,146,60,0.12)] transition-all duration-300 p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-linear-to-br from-amber-100 to-orange-100 rounded-xl group-hover/card:scale-110 transition-transform duration-200">
                                        <Lock size={20} className="text-amber-600" strokeWidth={2.5} />
                                    </div>
                                    <h2 className="text-xl font-bold bg-linear-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                        {hasPassword ? 'Security & Password' : 'Set Password'}
                                    </h2>
                                </div>

                                {/* Authentication Methods Info */}
                                {(hasPassword || googleLinked) && (
                                    <div className="mb-6 p-4 bg-linear-to-r from-blue-50 to-cyan-50 border border-blue-200/60 rounded-xl">
                                        <h3 className="text-sm font-semibold text-blue-900 mb-2">Authentication Methods</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {hasPassword && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                                                    <Lock size={14} />
                                                    Username/Password
                                                </span>
                                            )}
                                            {googleLinked && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                                    </svg>
                                                    Google Account
                                                </span>
                                            )}
                                        </div>
                                        {!hasPassword && googleLinked && (
                                            <p className="mt-2 text-xs text-blue-700">
                                                💡 Set a password to enable username/password login as backup
                                            </p>
                                        )}
                                    </div>
                                )}

                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    {/* Current Password - Only show if user has existing password */}
                                    {hasPassword && (
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
                                                    required={hasPassword}
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
                                    )}

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
                                        className="w-full mt-8 bg-linear-to-r from-amber-600 to-orange-600 hover:shadow-lg hover:shadow-amber-500/30 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex justify-center items-center gap-2 shadow-md disabled:shadow-none cursor-pointer hover:scale-[1.02]"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
                                                {hasPassword ? 'Updating...' : 'Setting...'}
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={18} strokeWidth={2.5} />
                                                {hasPassword ? 'Update Password' : 'Set Password'}
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Tips */}
                <div className="mt-12 p-6 bg-blue-50/90 backdrop-blur-xl border border-blue-200/60 rounded-2xl shadow-[0_8px_32px_rgba(59,130,246,0.08)]">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <AlertCircle size={18} strokeWidth={2.5} />
                        Security Tips
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>Use a strong password with at least 8 characters, including numbers and symbols</span>
                        </li>
                        {hasPassword && (
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>Change your password regularly for better account security</span>
                            </li>
                        )}
                        {googleLinked && !hasPassword && (
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>Setting a password provides a backup login method if Google sign-in is unavailable</span>
                            </li>
                        )}
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
