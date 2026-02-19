import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import getCroppedImg from '../lib/cropImage';
import imageCompression from 'browser-image-compression';
import { Upload, X, Check, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';

interface AvatarUploadProps {
    currentAvatar?: string;
    onUpload: (url: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentAvatar, onUpload }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl);
            setIsOpen(true);
        }
    };

    const readFile = (file: File) => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result as string));
            reader.readAsDataURL(file);
        });
    };

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsUploading(true);
        try {
            // 1. Get Cropped Blob
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (!croppedBlob) throw new Error('Failed to crop image');

            // 2. Compress
            const compressedFile = await imageCompression(croppedBlob as File, {
                maxSizeMB: 0.5, // Max 500KB
                maxWidthOrHeight: 800, // Max 800px
                useWebWorker: true,
                fileType: 'image/jpeg'
            });

            // 3. Upload
            const formData = new FormData();
            formData.append('file', compressedFile, 'avatar.jpg');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            onUpload(data.url);
            setIsOpen(false);
            setImageSrc(null);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <div className="relative group/upload">
                <label className="cursor-pointer">
                    <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                    <div className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-blue-200 shadow-sm">
                        <Upload size={14} /> Upload New
                    </div>
                </label>
            </div>

            {isOpen && imageSrc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <ImageIcon size={18} className="text-blue-500" /> Adjust Profile Picture
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative h-80 w-full bg-slate-900">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            <div className="flex items-center gap-4">
                                <ZoomOut size={16} className="text-slate-400" />
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <ZoomIn size={16} className="text-slate-400" />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isUploading}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? (
                                        <>Uploading...</>
                                    ) : (
                                        <>
                                            <Check size={18} /> Save Photo
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AvatarUpload;
