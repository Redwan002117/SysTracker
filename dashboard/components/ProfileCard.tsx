import React, { useState } from 'react';
import { Machine } from '../types';
import { User, Edit2, Check, X as XIcon, Share, Star, Briefcase, Hash, Layers, MapPin, ArrowRight, Activity, Loader } from 'lucide-react';
import AvatarUpload from './AvatarUpload';

interface ProfileCardProps {
    machine: Machine;
    onUpdate: (profile: Machine['profile']) => Promise<boolean>;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ machine, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const defaultProfile = machine.profile || {
        name: 'Unassigned',
        role: 'No Role Set',
        tags: [],
        stats: [
            { label: 'Rating', value: '0.0' },
            { label: 'Uptime', value: '0%' },
            { label: 'Rate', value: '$0/hr' }
        ]
    };

    // Local display state — initialized from prop, kept in sync when not editing
    const [profile, setProfile] = useState(defaultProfile);
    const [tempProfile, setTempProfile] = useState(defaultProfile);

    // When the machine.profile prop updates (e.g. socket pushes a fresh copy
    // after another client saves), re-sync local state — but never while the
    // user is actively editing so their in-progress changes aren't lost.
    React.useEffect(() => {
        if (!isEditing) {
            const fresh = machine.profile || {
                name: 'Unassigned',
                role: 'No Role Set',
                tags: [],
                stats: [
                    { label: 'Rating', value: '0.0' },
                    { label: 'Uptime', value: '0%' },
                    { label: 'Rate', value: '$0/hr' }
                ]
            };
            setProfile(fresh);
            setTempProfile(fresh);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [machine.profile]);

    const handleSave = async () => {
        setSaveError(null);
        setIsSaving(true);
        const success = await onUpdate(tempProfile);
        setIsSaving(false);
        if (success) {
            setProfile(tempProfile);
            setIsEditing(false);
        } else {
            setSaveError('Failed to save. Check your connection and try again.');
        }
    };

    const handleCancel = () => {
        setTempProfile(profile);
        setSaveError(null);
        setIsEditing(false);
    };

    return (
        <div className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl transition-all duration-300 hover:shadow-2xl group w-full">
            {/* Gradient Background Effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl group-hover:bg-purple-500/30 transition-colors pointer-events-none"></div>

            <div className={`relative z-10 flex flex-col items-center text-center h-full ${isEditing ? 'p-4' : 'p-6 lg:p-8'}`}>
                <div className="absolute top-4 right-4 z-50">
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2.5 rounded-full bg-slate-100/50 hover:bg-white text-slate-500 hover:text-blue-600 transition-all shadow-sm hover:shadow-md backdrop-blur-sm"
                            title="Edit Profile"
                        >
                            <Edit2 size={18} />
                        </button>
                    )}
                </div>

                {/* Avatar */}
                <div className={`relative group/avatar mt-2 ${isEditing ? 'mb-3' : 'mb-8'}`}>
                    <div className={`rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-2 shadow-inner relative mx-auto ring-4 ring-white/50 ${isEditing ? 'w-20 h-20' : 'w-40 h-40'}`}>
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden relative">
                            {profile.avatar ? (
                                <img src={isEditing ? tempProfile.avatar! : profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={isEditing ? 32 : 64} className="text-slate-300" />
                            )}

                            {/* Hover Overlay for Edit Mode suggestion */}
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none">
                                    <span className="text-white text-xs font-bold drop-shadow-md">Randomize</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {isEditing && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 w-full justify-center">
                            <AvatarUpload onUpload={(url) => setTempProfile({ ...tempProfile, avatar: url })} />
                            <button
                                onClick={() => {
                                    const randomSeed = Math.random().toString(36).substring(7);
                                    const styles = ['adventurer', 'fun-emoji', 'avataaars', 'bottts', 'lorelei'];
                                    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
                                    setTempProfile({ ...tempProfile, avatar: `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}` });
                                }}
                                className="p-2 bg-white border border-slate-200 text-slate-500 rounded-full hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm"
                                title="Randomize Avatar"
                            >
                                <Share size={14} />
                            </button>
                        </div>
                    )}
                </div>


                {/* Name & Role */}
                {isEditing ? (
                    <div className="w-full space-y-2 mb-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="space-y-1.5">
                            <input
                                type="text"
                                value={tempProfile.name}
                                onChange={e => setTempProfile({ ...tempProfile, name: e.target.value })}
                                className="w-full text-center font-bold text-base bg-white/80 rounded-xl px-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all placeholder:text-slate-300"
                                placeholder="Full Name"
                            />
                            <input
                                type="text"
                                value={tempProfile.role}
                                onChange={e => setTempProfile({ ...tempProfile, role: e.target.value })}
                                className="w-full text-center text-slate-600 text-sm bg-white/80 rounded-xl px-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm transition-all placeholder:text-slate-300"
                                placeholder="Job Title / Role"
                            />
                        </div>

                        {/* Fields Grid */}
                        <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/60">
                            <div className="grid grid-cols-2 gap-1.5">
                                <input
                                    type="text"
                                    value={tempProfile.email || ''}
                                    onChange={e => setTempProfile({ ...tempProfile, email: e.target.value })}
                                    className="col-span-2 w-full text-center text-sm bg-white rounded-lg px-2 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="Email Address"
                                />
                                <input
                                    type="text"
                                    value={tempProfile.department || ''}
                                    onChange={e => setTempProfile({ ...tempProfile, department: e.target.value })}
                                    className="col-span-2 w-full text-center text-sm bg-white rounded-lg px-2 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="Department"
                                />
                                <input
                                    type="text"
                                    value={tempProfile.floor_name || ''}
                                    onChange={e => setTempProfile({ ...tempProfile, floor_name: e.target.value })}
                                    className="w-full text-center text-sm bg-white rounded-lg px-2 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="Floor (e.g. 3rd)"
                                />
                                <input
                                    type="text"
                                    value={tempProfile.desk_name || ''}
                                    onChange={e => setTempProfile({ ...tempProfile, desk_name: e.target.value })}
                                    className="w-full text-center text-sm bg-white rounded-lg px-2 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="Desk (e.g. D-12)"
                                />
                                <input
                                    type="text"
                                    value={tempProfile.pc_number || ''}
                                    onChange={e => setTempProfile({ ...tempProfile, pc_number: e.target.value })}
                                    className="col-span-2 w-full text-center text-sm bg-white rounded-lg px-2 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="Asset ID (e.g. PC-2024-X)"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">{profile.name}</h3>
                        <p className="text-slate-500 font-medium mb-6 bg-slate-100/50 inline-block px-4 py-1.5 rounded-full text-base border border-slate-200/50">
                            {profile.role}
                        </p>

                        {/* Location / Asset Info */}
                        {(profile.desk_name || profile.floor_name || profile.pc_number) && (
                            <div className="flex flex-wrap justify-center gap-2.5 mb-8 w-full">
                                {profile.floor_name && (
                                    <span className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 shadow-sm">
                                        <Layers size={14} className="text-blue-500" /> {profile.floor_name}
                                    </span>
                                )}
                                {profile.desk_name && (
                                    <span className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 shadow-sm">
                                        <MapPin size={14} className="text-red-500" /> {profile.desk_name}
                                    </span>
                                )}
                                {profile.pc_number && (
                                    <span className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 shadow-sm">
                                        <Hash size={14} className="text-slate-400" /> {profile.pc_number}
                                    </span>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Tags */}
                <div className={`flex flex-wrap justify-center gap-2 ${isEditing ? 'mb-2' : 'mb-10'}`}>
                    {(isEditing ? [] : (profile.tags || ['Design', 'UX'])).map((tag, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-xs font-bold border border-slate-200/80 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all cursor-default uppercase tracking-wide">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Stats Grid - Live Data */}
                <div className={`grid grid-cols-3 gap-px bg-slate-200/50 rounded-2xl overflow-hidden border border-slate-200/50 w-full shadow-sm ${isEditing ? 'mb-3' : 'mb-8'}`}>
                    {/* Location */}
                    <div className={`flex flex-col items-center bg-white/50 hover:bg-white transition-colors group/stat ${isEditing ? 'p-2' : 'p-4'}`}>
                        <span className={`text-slate-900 font-bold truncate w-full text-center ${isEditing ? 'text-sm' : 'text-xl'}`} title={profile.desk_name || profile.floor_name || 'N/A'}>
                            {profile.desk_name || profile.floor_name || 'N/A'}
                        </span>
                        <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold mt-0.5 flex items-center gap-1">
                            <MapPin size={10} /> Location
                        </span>
                    </div>

                    {/* Uptime */}
                    <div className={`flex flex-col items-center bg-white/50 hover:bg-white transition-colors group/stat ${isEditing ? 'p-2' : 'p-4'}`}>
                        <span className={`text-slate-900 font-bold font-mono ${isEditing ? 'text-sm' : 'text-xl'}`}>
                            {(() => {
                                const seconds = machine.metrics?.uptime_seconds || 0;
                                const days = Math.floor(seconds / 86400);
                                const hours = Math.floor((seconds % 86400) / 3600);
                                if (days > 0) return `${days}d ${hours}h`;
                                const minutes = Math.floor((seconds % 3600) / 60);
                                return `${hours}h ${minutes}m`;
                            })()}
                        </span>
                        <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold mt-0.5 flex items-center gap-1">
                            <Activity size={10} className="text-emerald-500" /> Uptime
                        </span>
                    </div>

                    {/* Asset ID */}
                    <div className={`flex flex-col items-center bg-white/50 hover:bg-white transition-colors group/stat ${isEditing ? 'p-2' : 'p-4'}`}>
                        <span className={`text-slate-900 font-bold truncate w-full text-center ${isEditing ? 'text-sm' : 'text-xl'}`} title={profile.pc_number || 'N/A'}>
                            {profile.pc_number || 'N/A'}
                        </span>
                        <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold mt-0.5 flex items-center gap-1">
                            <Hash size={10} /> Asset
                        </span>
                    </div>
                </div>

                {/* Actions */}
                {isEditing ? (
                    <div className="flex flex-col gap-2 w-full animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex gap-3">
                            <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-[0.98] text-sm">
                                {isSaving
                                    ? <><Loader size={15} className="animate-spin" /> Saving...</>
                                    : <><Check size={16} strokeWidth={2.5} /> Save Profile</>}
                            </button>
                            <button onClick={handleCancel} disabled={isSaving} className="bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 font-semibold p-2.5 rounded-xl transition-all border border-slate-200 hover:border-red-200 flex items-center justify-center active:scale-[0.98] disabled:opacity-60">
                                <XIcon size={18} />
                            </button>
                        </div>
                        {saveError && (
                            <p className="text-xs text-red-500 text-center font-medium px-1">{saveError}</p>
                        )}
                    </div>
                ) : (
                    <div className="w-full space-y-3">
                        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 text-left space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact User</h4>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
                                    <User size={16} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs text-slate-400">Email Address</div>
                                    <div className="text-sm font-medium text-slate-700 truncate">{profile.email || 'No email set'}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
                                    <Briefcase size={16} />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs text-slate-400">Department</div>
                                    <div className="text-sm font-medium text-slate-700 truncate">{profile.department || 'General'}</div>
                                </div>
                            </div>
                        </div>

                        <a
                            href={`mailto:${profile.email}`}
                            className={`flex w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-slate-900/20 active:scale-[0.98] items-center justify-center gap-2 group/btn text-base ${!profile.email ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                        >
                            <span>Send Email</span>
                            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </a>
                    </div>
                )}
            </div>
        </div >
    );
};

export default ProfileCard;
