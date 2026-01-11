import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Crop, CheckCircle, Square, Play, Download, Settings, Mic, MicOff, Video, Sliders, Share2, Youtube, Facebook, UploadCloud, Sparkles, Rewind, Clock, Laptop, Volume2, Film, Wand2, X, Camera, CameraOff } from 'lucide-react';

import { GoogleGenerativeAI } from "@google/generative-ai";

const SocialIcon = ({ type, className }) => {
    // ... (keep existing)
    if (type === 'tiktok') {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
        );
    }
    if (type === 'discord') {
        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
        )
    }
    return null;
}

function App() {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [stream, setStream] = useState(null);
    const [micEnabled, setMicEnabled] = useState(false);
    const [systemAudioEnabled, setSystemAudioEnabled] = useState(true);
    const [selectedSource, setSelectedSource] = useState(null);
    const [error, setError] = useState(null);
    const [sourceSelectionModal, setSourceSelectionModal] = useState(null);

    // Settings logic
    const [showSettings, setShowSettings] = useState(false);
    const [settingsTab, setSettingsTab] = useState('video'); // video, audio, ai
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '');

    // Audio Settings
    const [audioBitrate, setAudioBitrate] = useState(128000); // 128 kbps default

    const [selectedMicId, setSelectedMicId] = useState('default');
    const [audioDevices, setAudioDevices] = useState([]);
    const [noiseSuppression, setNoiseSuppression] = useState(true);

    // Webcam State
    const [webcamEnabled, setWebcamEnabled] = useState(false);
    const [selectedWebcamId, setSelectedWebcamId] = useState('default');
    const [videoInputDevices, setVideoInputDevices] = useState([]);

    // Video Settings
    const [videoResolution, setVideoResolution] = useState('1080p'); // 4k, 2k, 1080p, 720p, 480p
    const [frameRate, setFrameRate] = useState(60); // 30, 60, 0 (Native/Max)

    useEffect(() => {
        const getDevices = async () => {
            try {
                // Request permissions to get labels
                await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
                setVideoInputDevices(devices.filter(d => d.kind === 'videoinput'));
            } catch (e) {
                console.warn("Failed to enumerate devices:", e);
                // Try enumerating anyway in case we have partial permissions
                const devices = await navigator.mediaDevices.enumerateDevices();
                setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
                setVideoInputDevices(devices.filter(d => d.kind === 'videoinput'));
            }
        };
        getDevices();
    }, []);

    // AI Features State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isTrimming, setIsTrimming] = useState(false);
    const [trimMessage, setTrimMessage] = useState(null);

    const [isReplayMode, setIsReplayMode] = useState(false);
    const [replayDuration, setReplayDuration] = useState(30); // seconds
    const [replayBufferActive, setReplayBufferActive] = useState(false);
    const replayChunksRef = useRef([]);

    const [savedClips, setSavedClips] = useState([]);

    // Countdown State
    const [countdown, setCountdown] = useState(null);
    // Refs
    const mediaRecorderRef = useRef(null);
    const recordingStartTimeRef = useRef(null);
    const timerRef = useRef(null);
    const initialChunkRef = useRef(null); // For Flashback header
    const replayDurationRef = useRef(replayDuration);
    const replayBufferActiveRef = useRef(replayBufferActive);
    const webcamPreviewRef = useRef(null); // For live preview UI

    // Update refs when state changes
    useEffect(() => { replayDurationRef.current = replayDuration; }, [replayDuration]);
    useEffect(() => { replayBufferActiveRef.current = replayBufferActive; }, [replayBufferActive]);

    // Webcam Preview Effect
    useEffect(() => {
        let stream = null;
        if (webcamEnabled && !isRecording && !replayBufferActive) {
            const startPreview = async () => {
                try {
                    // Check if device is still available or selected
                    const constraints = {
                        video: {
                            deviceId: selectedWebcamId !== 'default' ? { exact: selectedWebcamId } : undefined,
                            width: { ideal: 640 },
                            height: { ideal: 360 } // Low res for preview is fine, or match setting
                        }
                    };
                    stream = await navigator.mediaDevices.getUserMedia(constraints);
                    if (webcamPreviewRef.current) {
                        webcamPreviewRef.current.srcObject = stream;
                    }
                } catch (e) {
                    console.error("Preview Webcam blocked/failed:", e);
                }
            };
            startPreview();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }
        };
    }, [webcamEnabled, selectedWebcamId, isRecording, replayBufferActive]);
    const isRecordingRef = useRef(isRecording);
    const selectedSourceRef = useRef(selectedSource);
    useEffect(() => {
        isRecordingRef.current = isRecording;
        selectedSourceRef.current = selectedSource;
        replayBufferActiveRef.current = replayBufferActive;
        replayDurationRef.current = replayDuration;
    }, [isRecording, selectedSource, replayBufferActive, replayDuration]);

    useEffect(() => {
        if (apiKey) localStorage.setItem('GEMINI_API_KEY', apiKey);
    }, [apiKey]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const extractFrames = async (videoBlob, numFrames = 3, knownDuration = null) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(videoBlob);
        video.muted = true;
        video.playsInline = true;

        await new Promise(r => video.onloadedmetadata = r);

        const frames = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || 1920;
        canvas.height = video.videoHeight || 1080;

        // MediaRecorder blobs often have Infinity duration. Use known duration if available.
        let duration = knownDuration || video.duration;
        if (!Number.isFinite(duration)) {
            console.warn("Video duration is Infinity, defaulting to known recording time or 10s fallback");
            duration = recordingTime > 0 ? recordingTime : 10;
        }

        const interval = duration / (numFrames + 1);

        for (let i = 1; i <= numFrames; i++) {
            const targetTime = interval * i;
            video.currentTime = targetTime;

            // Safe seek with timeout
            await new Promise((resolve) => {
                const onSeek = () => {
                    video.removeEventListener('seeked', onSeek);
                    resolve();
                };
                const onTimeout = () => {
                    video.removeEventListener('seeked', onSeek);
                    console.warn(`Frame extraction seek timeout at ${targetTime}s`);
                    resolve(); // Resolve anyway to continue
                };

                video.addEventListener('seeked', onSeek);
                setTimeout(onTimeout, 1000); // 1s timeout
            });

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            frames.push({
                inlineData: {
                    data: base64,
                    mimeType: "image/jpeg"
                }
            });
        }
        return frames;
    };

    const parseAIJSON = (text) => {
        try {
            // 1. Try simple clean
            const cleanStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanStr);
        } catch (e) {
            // 2. Try Regex extraction for {...}
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                } catch (e2) {
                    console.error("JSON Regex parse failed:", e2);
                }
            }
            throw new Error("Failed to parse AI response as JSON: " + text.substring(0, 50) + "...");
        }
    };

    const handleAnalyzeAI = async () => {
        if (!apiKey) {
            setShowSettings(true);
            return;
        }

        setIsAnalyzing(true);
        setError(null);
        try {
            setTrimMessage("Extracting frames...");
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            // Ensure we at least pass 1 as duration to avoid divide by zero if something went wrong
            const durationArg = recordingTime > 0 ? recordingTime : 1;
            const frames = await extractFrames(blob, 3, durationArg);

            setTrimMessage("Consulting Gemini AI...");
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

            const prompt = "Analyze these screenshots from a screen recording. Provide a JSON response with: title (short catchy title), summary (2 sentences), and tags (array of 3 keywords). format: { \"title\": \"...\", \"summary\": \"...\", \"tags\": [...] }";

            const result = await model.generateContent([prompt, ...frames]);
            const response = await result.response;
            const text = response.text();

            const data = parseAIJSON(text);

            setAiAnalysis(data);
            setTrimMessage(null);
        } catch (err) {
            console.error(err);
            setError("AI Analysis failed: " + err.message);
            setTrimMessage(null);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const [suggestedTrim, setSuggestedTrim] = useState(null);

    const handleSmartTrim = async () => {
        if (!apiKey) {
            setShowSettings(true);
            return;
        }

        setIsTrimming(true);
        setTrimMessage(null);
        setSuggestedTrim(null);

        try {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });

            // Extract 10 frames from first 10 seconds
            const frames = await extractFrames(blob, 10); // Logic inside extractFrames needs update to handle interval seeking if it doesn't already
            // Actually, my extractFrames does "interval = duration / (numFrames + 1)". 
            // Better to make a specific extraction for start.

            // Custom extraction for start analysis
            const video = document.createElement('video');
            video.src = URL.createObjectURL(blob);
            video.muted = true;
            await new Promise(r => video.onloadedmetadata = r);

            const startFrames = [];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth || 1920;
            canvas.height = video.videoHeight || 1080;

            // Grab frames at 0, 1, 2... up to min(10, duration)
            let checkDuration = 10;
            if (Number.isFinite(video.duration)) {
                checkDuration = Math.min(10, video.duration);
            } else {
                // Fallback to recordingTime, but default to 10 if that's somehow 0 (shouldn't be if recorded)
                const fallbackDuration = recordingTime > 0 ? recordingTime : 10;
                checkDuration = Math.min(10, fallbackDuration);
            }

            for (let i = 0; i < checkDuration; i++) {
                video.currentTime = i;

                // Safe seek
                await new Promise((resolve) => {
                    const onSeek = () => { video.removeEventListener('seeked', onSeek); resolve(); };
                    const onTimeout = () => { video.removeEventListener('seeked', onSeek); resolve(); };
                    video.addEventListener('seeked', onSeek);
                    setTimeout(onTimeout, 1000);
                });

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1]; // Lower quality for speed
                startFrames.push({
                    inlineData: { data: base64, mimeType: "image/jpeg" }
                });
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

            const prompt = `Analyze these sequential frames taken at 1-second intervals from the start of a screen recording (0s, 1s, 2s...). 
            Identify the timestamp (in seconds) where meaningful activity starts (e.g. mouse movement, typing, window opening). 
            Ignore static screens or "starting recording" UI. 
            If it starts immediately, return 0. 
            Return JSON: { "start_time": number, "reason": "brief explanation" }`;

            const result = await model.generateContent([prompt, ...startFrames]);
            const response = await result.response;
            const text = response.text();

            const data = parseAIJSON(text);

            if (data.start_time > 0) {
                setSuggestedTrim(data.start_time);
                setTrimMessage(`AI suggests trimming the first ${data.start_time}s (${data.reason})`);
            } else {
                setTrimMessage("No trimming needed. Activity starts immediately.");
            }

        } catch (err) {
            console.error("Trim Analysis Error:", err);
            setError("Trim analysis failed: " + err.message);
        } finally {
            setIsTrimming(false);
        }
    };

    const applyTrim = async () => {
        if (!suggestedTrim || !window.electronAPI.trimVideo) return;

        setIsTrimming(true);
        try {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const arrayBuffer = await blob.arrayBuffer();
            const video = document.createElement('video');
            video.src = URL.createObjectURL(blob);
            await new Promise(r => video.onloadedmetadata = r);
            const duration = video.duration;

            // Trim
            const trimmedBuffer = await window.electronAPI.trimVideo(arrayBuffer, suggestedTrim, duration - suggestedTrim);

            // Create new blob
            const trimmedBlob = new Blob([trimmedBuffer], { type: 'video/webm' });
            const newUrl = URL.createObjectURL(trimmedBlob);

            setPreviewUrl(newUrl);
            setRecordedChunks([trimmedBlob]); // Update chunks so "Save" uses trimmed
            setTrimMessage(`Trimmed ${suggestedTrim}s successfully!`);
            setSuggestedTrim(null);

        } catch (err) {
            console.error("Apply Trim Error:", err);
            setError("Failed to apply trim: " + err.message);
        } finally {
            setIsTrimming(false);
        }
    };

    // --- Helper for Composed Stream (Webcam + Screen + Crop) ---
    const createComposedStream = (screenStream, webcamStream = null, cropRect = null) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { alpha: false });

        // Helper to create and safeguard video elements
        const createVideoEl = (stream) => {
            const v = document.createElement('video');
            v.srcObject = stream;
            v.muted = true;
            // append to body hidden to ensure it plays on all browsers/electron versions
            v.style.position = 'fixed';
            v.style.top = '-9999px';
            v.style.opacity = '0';
            document.body.appendChild(v);
            v.play().catch(e => console.error("Video play failed", e));
            return v;
        };

        const screenVideo = createVideoEl(screenStream);
        let webcamVideo = null;
        if (webcamStream) {
            webcamVideo = createVideoEl(webcamStream);
        }

        // We can't immediately know size, but we can guess or wait.
        // For screen sharing, tracks often have settings immediately.
        const settings = screenStream.getVideoTracks()[0].getSettings();
        let width = cropRect ? cropRect.width : (settings.width || 1920);
        let height = cropRect ? cropRect.height : (settings.height || 1080);

        canvas.width = width;
        canvas.height = height;

        const draw = () => {
            // Check if recording stopped (simple check via ref or checking streams)
            // Actually, we should check if screenStream is active
            if (screenStream.getTracks().every(t => t.readyState === 'ended')) {
                // Cleanup
                if (webcamVideo) { document.body.removeChild(webcamVideo); webcamVideo = null; }
                if (screenVideo) { document.body.removeChild(screenVideo); }
                return;
            }

            if (screenVideo.readyState >= 2) { // HAVE_CURRENT_DATA
                // Auto-resize canvas if screen size changes (and not cropping)
                if (!cropRect && (screenVideo.videoWidth && (canvas.width !== screenVideo.videoWidth || canvas.height !== screenVideo.videoHeight))) {
                    canvas.width = screenVideo.videoWidth;
                    canvas.height = screenVideo.videoHeight;
                    width = canvas.width;
                    height = canvas.height;
                }

                ctx.drawImage(
                    screenVideo,
                    cropRect ? cropRect.x : 0,
                    cropRect ? cropRect.y : 0,
                    cropRect ? cropRect.width : screenVideo.videoWidth,
                    cropRect ? cropRect.height : screenVideo.videoHeight,
                    0, 0, canvas.width, canvas.height
                );

                // Draw Webcam Overlay
                if (webcamVideo && webcamVideo.readyState >= 2) {
                    // PIP Logic: Bottom Right, 20% width
                    const camW = width * 0.25; // Slightly larger: 25%
                    const camH = camW * (webcamVideo.videoHeight / webcamVideo.videoWidth);
                    const margin = 30;
                    const camX = width - camW - margin;
                    const camY = height - camH - margin;

                    // Shadow/Border background
                    ctx.save();
                    ctx.shadowColor = "rgba(0,0,0,0.5)";
                    ctx.shadowBlur = 20;

                    // Clip Round Rect
                    ctx.beginPath();
                    ctx.roundRect(camX, camY, camW, camH, 20);
                    ctx.clip();

                    // Draw Video
                    ctx.drawImage(webcamVideo, camX, camY, camW, camH);
                    ctx.restore();

                    // Border
                    ctx.beginPath();
                    ctx.roundRect(camX, camY, camW, camH, 20);
                    ctx.lineWidth = 6;
                    ctx.strokeStyle = '#6366f1'; // Indigo-500
                    ctx.stroke();
                }
            }
            requestAnimationFrame(draw);
        };

        requestAnimationFrame(draw);

        // 60FPS output
        const stream = canvas.captureStream(frameRate || 60);

        // Link stream stopping to cleanup
        // Note: This cleanup might be redundant with the loop check but good for safety
        stream.getVideoTracks()[0].onended = () => {
            if (webcamVideo && webcamVideo.parentNode) document.body.removeChild(webcamVideo);
            if (screenVideo && screenVideo.parentNode) document.body.removeChild(screenVideo);
        };

        return stream;
    };

    const handleStartRecording = async (providedSource = null, forceFlashback = false) => {
        try {
            const sourceToUse = providedSource || selectedSource;

            if (!sourceToUse) {
                await handleSelectScreen();
                return;
            }

            if (providedSource) {
                setSelectedSource(providedSource);
            }

            // Sync state for immediate logic
            const sourceId = sourceToUse.id;

            // Determine mode
            // If forceFlashback is true, use it. Otherwise use state.
            // But state might be stale if we just set it. 
            // We use the param to guide logic.
            const isFlashback = forceFlashback || isReplayMode;

            // Start Countdown (UI State, not logic)
            // We defer visual "Recording" state until after countdown, but we do need to block multiple clicks

            setError(null);
            setRecordedChunks([]);
            setPreviewUrl(null);
            setAiAnalysis(null); // Reset AI
            setTrimMessage(null); // Reset Trim
            initialChunkRef.current = null; // Reset Header

            recordingStartTimeRef.current = Date.now();

            // 1. Get Video Stream (+ System Audio via constraints)
            let videoConstraints;
            let audioConstraints = false; // Default to no system audio

            let activeSourceId = sourceToUse.id;

            if (sourceToUse.id === 'area') {
                const sources = await window.electronAPI.getSources();
                const screenSource = sources[0];
                activeSourceId = screenSource.id; // Correct ID for Area mode

                videoConstraints = {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: activeSourceId,
                        maxWidth: 4000, maxHeight: 4000, // Area always wants max to crop from
                        minFrameRate: frameRate === 0 ? 60 : frameRate,
                        maxFrameRate: frameRate === 0 ? 144 : frameRate
                    }
                };
            } else {
                let width = 1920, height = 1080;
                switch (videoResolution) {
                    case '4k': width = 3840; height = 2160; break;
                    case '2k': width = 2560; height = 1440; break;
                    case '1080p': width = 1920; height = 1080; break;
                    case '720p': width = 1280; height = 720; break;
                    case '480p': width = 854; height = 480; break;
                }

                videoConstraints = {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: activeSourceId,
                        maxWidth: width, maxHeight: height,
                        minWidth: width, minHeight: height, // Force resolution
                        minFrameRate: frameRate === 0 ? 30 : frameRate,
                        maxFrameRate: frameRate === 0 ? 144 : frameRate // 0 = "Native" attempts high
                    }
                };
            }

            if (systemAudioEnabled) {
                audioConstraints = {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: activeSourceId
                    }
                };
            }

            let screenStream = await navigator.mediaDevices.getUserMedia({
                audio: audioConstraints,
                video: videoConstraints
            });

            // 2. Audio Mixing (System + Mic)
            const audioContext = new AudioContext();
            const dest = audioContext.createMediaStreamDestination();
            let hasAudioMixing = false;

            if (systemAudioEnabled && screenStream.getAudioTracks().length > 0) {
                const sysSrc = audioContext.createMediaStreamSource(screenStream);
                const sysGain = audioContext.createGain();
                sysGain.gain.value = 0.7; // Lower system audio slightly so voice pops
                sysSrc.connect(sysGain).connect(dest);
                hasAudioMixing = true;
            }

            if (micEnabled) {
                try {
                    const micConstraints = {
                        audio: {
                            deviceId: selectedMicId !== 'default' ? { exact: selectedMicId } : undefined,
                            noiseSuppression: noiseSuppression,
                            echoCancellation: noiseSuppression,
                            autoGainControl: noiseSuppression
                        },
                        video: false
                    };
                    const micStream = await navigator.mediaDevices.getUserMedia(micConstraints);

                    if (micStream.getAudioTracks().length > 0) {
                        const micSrc = audioContext.createMediaStreamSource(micStream);
                        micSrc.connect(dest);
                        hasAudioMixing = true;
                    }
                } catch (e) {
                    console.warn("Mic capture failed:", e);
                }
            }

            // 3. Webcam Capture (if enabled)
            let webcamStream = null;
            if (webcamEnabled) {
                try {
                    const camConstraints = {
                        video: {
                            deviceId: selectedWebcamId !== 'default' ? { exact: selectedWebcamId } : undefined,
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        },
                        audio: false
                    };
                    webcamStream = await navigator.mediaDevices.getUserMedia(camConstraints);
                } catch (e) {
                    console.warn("Webcam capture failed:", e);
                    // maybe alert user?
                }
            }

            // 4. Final Stream Composition
            const finalStream = new MediaStream();

            // If we need custom composition (Area crop OR Webcam overlay), use the canvas helper
            const sourceRect = (sourceToUse.id === 'area' && sourceToUse.rect) ? sourceToUse.rect : null;

            if (sourceRect || webcamStream) {
                const composedVideoStream = createComposedStream(screenStream, webcamStream, sourceRect);
                composedVideoStream.getVideoTracks().forEach(track => finalStream.addTrack(track));
            } else {
                // Direct passthrough if no processing needed
                screenStream.getVideoTracks().forEach(track => finalStream.addTrack(track));
            }

            if (hasAudioMixing) {
                // Use the mixed audio track
                dest.stream.getAudioTracks().forEach(track => finalStream.addTrack(track));
            } else if (screenStream.getAudioTracks().length > 0) {
                // If we didn't use audioContext mix for some reason but have system audio (e.g. mic was off), use it directly
                // But above logic covers this.
            }

            setStream(finalStream);

            // COUNTDOWN LOGIC
            if (!isFlashback) {
                setCountdown(2);
                await new Promise(r => setTimeout(r, 1000));
                setCountdown(1);
                await new Promise(r => setTimeout(r, 1000));
                setCountdown(null);
            }

            // Show Overlay NOW (after countdown)
            if (window.electronAPI && window.electronAPI.showOverlay) {
                window.electronAPI.showOverlay(isFlashback ? 'replay' : 'record');
            }

            // NOW set is recording
            setIsRecording(true);
            recordingStartTimeRef.current = Date.now();

            const options = {
                mimeType: 'video/webm; codecs=vp9',
                videoBitsPerSecond: 25000000, // 25 Mbps
                audioBitsPerSecond: audioBitrate
            };
            const mediaRecorder = new MediaRecorder(finalStream, options);
            mediaRecorderRef.current = mediaRecorder;

            if (isFlashback) {
                // Replay Buffer Logic
                replayChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        const now = Date.now();

                        // Capture Initialization Segment (Header)
                        if (!initialChunkRef.current) {
                            initialChunkRef.current = event.data;
                        }

                        replayChunksRef.current.push({ data: event.data, timestamp: now });

                        // Prune old chunks (keep buffer + 10s extra safety)
                        const cutoff = now - (replayDurationRef.current * 1000) - 10000;
                        while (replayChunksRef.current.length > 0 && replayChunksRef.current[0].timestamp < cutoff) {
                            replayChunksRef.current.shift();
                        }
                    }
                };

                mediaRecorder.onstop = () => {
                    setReplayBufferActive(false);
                    setIsRecording(false);
                    if (window.electronAPI && window.electronAPI.hideOverlay) window.electronAPI.hideOverlay();
                    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                };

                // Request data every 1s for granular buffer
                mediaRecorder.start(1000);
                setReplayBufferActive(true);
                // In replay mode, show "Ready" or buffer time on overlay
                if (window.electronAPI && window.electronAPI.updateOverlayTime) window.electronAPI.updateOverlayTime('Flashback');
            } else {
                // Standard Recording Logic
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        setRecordedChunks((prev) => [...prev, event.data]);
                    }
                };

                mediaRecorder.onstop = () => {
                    stopTimer();
                    setIsRecording(false);
                    if (window.electronAPI && window.electronAPI.hideOverlay) window.electronAPI.hideOverlay();
                    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                };
                mediaRecorder.start();
                startTimer();
            }
        } catch (err) {
            console.error("Error starting recording:", err);
            setError("Failed to start recording. " + err.message);
            setIsRecording(false);
            setReplayBufferActive(false);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    };

    // Refs for function access in listeners
    const handleStartRecordingRef = useRef(handleStartRecording);
    const handleStopRecordingRef = useRef(handleStopRecording);

    const saveReplay = async () => {
        if (!replayBufferActiveRef.current) return;

        if (replayChunksRef.current.length === 0) {
            setTrimMessage("Buffer empty! Wait a moment...");
            setTimeout(() => setTrimMessage(null), 2000);
            return;
        }

        setTrimMessage("Saving Flashback...");
        const now = Date.now();
        const cutoff = now - (replayDurationRef.current * 1000);

        // Filter chunks that overlap with the time window
        let validChunksInfo = replayChunksRef.current.filter(chunk => chunk.timestamp >= cutoff);

        // Fallback if nothing matches time (e.g. very short starting session)
        if (validChunksInfo.length === 0 && replayChunksRef.current.length > 0) {
            validChunksInfo = [...replayChunksRef.current];
        }

        if (validChunksInfo.length === 0) {
            setTrimMessage("Error: No video data captured.");
            return;
        }

        try {
            // 1. Construct the raw blob (Header + Gap + Recent Chunks)
            const videoChunks = [];
            if (initialChunkRef.current) {
                videoChunks.push(initialChunkRef.current);
            }

            validChunksInfo.forEach(c => {
                if (c.data !== initialChunkRef.current) {
                    videoChunks.push(c.data);
                }
            });

            const rawBlob = new Blob(videoChunks, { type: 'video/webm' });
            const arrayBuffer = await rawBlob.arrayBuffer();

            // 2. Calculate Start Time for FFmpeg
            // validChunksInfo[0].timestamp is the time the chunk *finished* (ondataavailable).
            // We assume chunks are approx 1s duration (set in mediaRecorder.start(1000)).
            // So the content starts approx 1s before the timestamp.
            // We calculate the offset relative to the actual recording start.
            const firstChunkTimestamp = validChunksInfo[0].timestamp;
            let startTimeSeconds = (firstChunkTimestamp - recordingStartTimeRef.current - 1000) / 1000;
            if (startTimeSeconds < 0) startTimeSeconds = 0;

            console.log(`Flashback Save: Seeking to ${startTimeSeconds}s`);

            // 3. Process with FFmpeg to fix timestamps ("trim" the gap)
            // If electron API is available, use it. Otherwise fallback to raw download (likely broken but better than nothing).
            let finalBlob = rawBlob;

            if (window.electronAPI && window.electronAPI.trimVideo) {
                const trimmedBuffer = await window.electronAPI.trimVideo(arrayBuffer, startTimeSeconds, replayDurationRef.current);
                finalBlob = new Blob([trimmedBuffer], { type: 'video/webm' });
            } else {
                console.warn("Electron API not available, saving raw stream (may have playback issues due to timestamp gaps).");
            }

            // 4. Store in List (instead of auto-download)
            const finalUrl = URL.createObjectURL(finalBlob);
            const newClip = {
                id: Date.now(),
                url: finalUrl,
                blob: finalBlob,
                duration: replayDurationRef.current,
                timestamp: new Date()
            };

            setSavedClips(prev => [newClip, ...prev]);

            setTrimMessage(`Clip saved to library!`);
            setTimeout(() => setTrimMessage(null), 3000);

        } catch (err) {
            console.error("Save Replay Error:", err);
            setTrimMessage("Save Failed: " + err.message);
        }
    };

    const saveReplayRef = useRef(saveReplay);

    useEffect(() => {
        handleStartRecordingRef.current = handleStartRecording;
        handleStopRecordingRef.current = handleStopRecording;
        saveReplayRef.current = saveReplay;
    }, [handleStartRecording, handleStopRecording]);

    // Hotkey listener
    useEffect(() => {
        if (!window.electronAPI) return;

        const handleToggle = () => {
            console.log("Hotkey triggered. Recording:", isRecordingRef.current, "Buffer:", replayBufferActiveRef.current);

            if (isReplayMode) {
                // In replay mode, toggle buffer on/off
                if (replayBufferActiveRef.current) {
                    handleStopRecordingRef.current();
                } else {
                    // Start buffer - Smart Detect Screen
                    if (window.electronAPI.getSources && window.electronAPI.getCurrentScreenId) {
                        Promise.all([window.electronAPI.getSources(), window.electronAPI.getCurrentScreenId()])
                            .then(([sources, currentId]) => {
                                const target = sources.find(s => s.id === currentId) || sources[0];
                                handleStartRecordingRef.current(target);
                            });
                    } else if (selectedSourceRef.current) {
                        handleStartRecordingRef.current();
                    }
                }
            } else {
                // Standard mode
                if (isRecordingRef.current) {
                    handleStopRecordingRef.current();
                } else {
                    // Start recording - Smart Detect Screen
                    if (window.electronAPI.getSources && window.electronAPI.getCurrentScreenId) {
                        Promise.all([window.electronAPI.getSources(), window.electronAPI.getCurrentScreenId()])
                            .then(([sources, currentId]) => {
                                const target = sources.find(s => s.id === currentId) || sources[0];
                                handleStartRecordingRef.current(target);
                            });
                    } else if (selectedSourceRef.current) {
                        handleStartRecordingRef.current();
                    }
                }
            }
        };

        const handleSaveReplay = () => {
            // Smart Action: If active -> Save. If not -> Start Flashback on current screen.
            if (replayBufferActiveRef.current) {
                saveReplayRef.current();
            } else {
                // Auto-switch to replay mode
                setIsReplayMode(true);
                setTrimMessage("Flashback Started... Wait 30s to fill buffer.");
                setTimeout(() => setTrimMessage(null), 3000);

                if (window.electronAPI.getSources && window.electronAPI.getCurrentScreenId) {
                    Promise.all([window.electronAPI.getSources(), window.electronAPI.getCurrentScreenId()])
                        .then(([sources, currentId]) => {
                            const target = sources.find(s => s.id === currentId) || sources[0];
                            handleStartRecordingRef.current(target);
                        })
                        .catch(err => {
                            console.error("Smart Start Failed:", err);
                            setError("Could not auto-start Flashback.");
                        });
                }
            }
        };

        window.electronAPI.onHotkeyToggleRecording(handleToggle);
        if (window.electronAPI.onHotkeySaveReplay) {
            window.electronAPI.onHotkeySaveReplay(handleSaveReplay);
        }
    }, [isReplayMode]); // Re-bind if mode changes to ensure correct logic if needed, though refs handle state

    // Preview generation
    useEffect(() => {
        if (!isRecording && recordedChunks.length > 0) {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
        }
    }, [isRecording, recordedChunks]);

    const startTimer = () => {
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => {
                const next = prev + 1;
                if (window.electronAPI && window.electronAPI.updateOverlayTime) {
                    // Slight rough formatting here, ideally pass helper
                    const mins = Math.floor(next / 60);
                    const secs = next % 60;
                    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                    window.electronAPI.updateOverlayTime(timeStr);
                }
                return next;
            });
        }, 1000);
    };

    const stopTimer = () => {
        clearInterval(timerRef.current);
    };

    const handleSelectScreen = async () => {
        if (window.electronAPI && window.electronAPI.getSources) {
            const sources = await window.electronAPI.getSources();
            setSourceSelectionModal(sources);
        } else {
            alert("Electron API not found. Run in Electron.");
        }
    };

    const selectSource = (source) => {
        setSelectedSource(source);
        setSourceSelectionModal(null);
    };

    const handleSelectRegion = async () => {
        if (window.electronAPI) {
            const rect = await window.electronAPI.selectArea();
            if (rect) {
                setSelectedSource({
                    id: 'area',
                    name: `Area ${Math.round(rect.width)}x${Math.round(rect.height)}`,
                    thumbnail: null,
                    rect: rect
                });
            }
        }
    };

    const handleDownload = () => {
        if (!previewUrl) return;
        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = `recording-${new Date().toISOString().replace(/:/g, '-')}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const openShare = (url) => {
        if (window.electronAPI && window.electronAPI.openExternal) {
            window.electronAPI.openExternal(url);
        } else {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">

            {/* Countdown Overlay */}
            {countdown !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="text-9xl font-black text-white animate-bounce drop-shadow-[0_0_50px_rgba(255,255,255,0.5)]">
                        {countdown}
                    </div>
                </div>
            )}

            {/* Background Ambience & Grid */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
                <div className="w-full max-w-3xl bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden ring-1 ring-white/10">

                    {/* Header */}
                    <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/20">
                                <Video className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                Capframe
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowSettings(true)}
                                className={`p-2 rounded-full transition-all duration-300 ${!apiKey ? 'text-orange-400 bg-orange-500/10 animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                                title="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSystemAudioEnabled(!systemAudioEnabled)}
                                    className={`p-2 rounded-full transition-all duration-300 ${systemAudioEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                                    title={systemAudioEnabled ? "System Audio On" : "System Audio Off"}
                                >
                                    <Laptop className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setMicEnabled(!micEnabled)}
                                    className={`p-2 rounded-full transition-all duration-300 ${micEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                                    title={micEnabled ? "Mic On" : "Mic Off"}
                                >
                                    {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={() => setWebcamEnabled(!webcamEnabled)}
                                    className={`p-2 rounded-full transition-all duration-300 ${webcamEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'}`}
                                    title={webcamEnabled ? "Webcam On" : "Webcam Off"}
                                >
                                    {webcamEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">

                        {/* Status & Timer */}
                        {/* Status & Timer */}
                        <div className="flex flex-col items-center justify-center space-y-4">

                            {/* Webcam Preview Box */}
                            {webcamEnabled && !isRecording && (
                                <div className="relative group w-48 aspect-video bg-black rounded-xl overflow-hidden border-2 border-slate-700/50 shadow-lg mb-2">
                                    <video
                                        ref={webcamPreviewRef}
                                        autoPlay
                                        muted
                                        className="w-full h-full object-cover transform scale-x-[-1]"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                        <span className="text-xs font-medium text-white">Preview</span>
                                    </div>
                                </div>
                            )}

                            {/* Flashback Mode Toggle */}
                            {!isRecording && !replayBufferActive && (
                                <div className="flex items-center justify-between w-full bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isReplayMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/30 text-slate-500'}`}>
                                            <Rewind className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-slate-200">Flashback Mode</div>
                                            <div className="text-xs text-slate-500">Buffer last {replayDuration}s</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newMode = !isReplayMode;
                                            setIsReplayMode(newMode);

                                            if (newMode) {
                                                // Start Buffering Immediately
                                                if (window.electronAPI.getSources && window.electronAPI.getCurrentScreenId) {
                                                    Promise.all([window.electronAPI.getSources(), window.electronAPI.getCurrentScreenId()])
                                                        .then(([sources, currentId]) => {
                                                            const target = sources.find(s => s.id === currentId) || sources[0];
                                                            // We need to set this state to trigger the "start" logic correctly with the new mode
                                                            // Actually, handleStartRecording checks "isReplayMode".
                                                            // Since setState is async, we might need a useEffect or pass a flag.
                                                            // Better: Setup the mode first, then trigger.
                                                            // But handleStartRecording uses the *REF* isRecordingRef/replayBufferActiveRef maybe? 
                                                            // No, it uses state 'isReplayMode'. 
                                                            // So we rely on React re-render? No, inside the same event loop it's old.
                                                            // We should update the handler to accept a mode override or wait.
                                                            // SIMPLER: Just set state, and let a useEffect trigger it? 
                                                            // Or just call it, but we need to ensure 'isReplayMode' state is true during execution.
                                                            // Force param:
                                                            handleStartRecording(target, true); // Add 'isFlashbackOverride' param to handleStartRecording?
                                                        })
                                                        .catch(err => console.error("Auto-buffer failed:", err));
                                                } else {
                                                    handleStartRecording(selectedSource, true);
                                                }
                                            } else {
                                                handleStopRecording();
                                            }
                                        }}
                                        className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out border border-transparent ${isReplayMode ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isReplayMode ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            )}

                            {isReplayMode ? (
                                <div className="min-h-[80px] flex flex-col items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                                    <div className={`text-xl font-medium tracking-wide flex items-center gap-2 ${replayBufferActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                                        {replayBufferActive ? (
                                            <>
                                                <span className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                                </span>
                                                Buffering...
                                            </>
                                        ) : 'Starting Buffer...'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Duration:</span>
                                        <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
                                            {[30, 60].map(dur => (
                                                <button
                                                    key={dur}
                                                    onClick={() => setReplayDuration(dur)}
                                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${replayDuration === dur ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                                                >
                                                    {dur}s
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1">
                                        Use <span className="text-slate-300 font-mono">Alt+Shift+S</span> to save last {replayDuration < 60 ? `${replayDuration}s` : `${replayDuration / 60}m`}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className={`text-6xl font-mono font-medium tracking-tighter ${isRecording ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-slate-500'}`}>
                                        {formatTime(recordingTime)}
                                    </div>
                                    <div className="flex items-center gap-2 h-6">
                                        {isRecording ? (
                                            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider border border-red-500/20 animate-pulse">
                                                <div className="w-1.5 h-1.5 bg-current rounded-full" />
                                                Recording Live
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 text-sm font-medium">Ready</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Source Selection & Preview */}
                        {
                            !isRecording && !previewUrl ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={handleSelectScreen}
                                        className={`group relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 overflow-hidden
                            ${selectedSource && selectedSource.id !== 'area' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-700 bg-slate-800/30 hover:border-indigo-500/50 hover:bg-slate-800/50'}
                        `}
                                    >
                                        <div className={`p-3 rounded-lg transition-colors ${selectedSource && selectedSource.id !== 'area' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600 group-hover:text-white'}`}>
                                            <Monitor className="w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <span className="block font-medium text-slate-200">Full Screen</span>
                                            <span className="text-xs text-slate-400 mt-1">{selectedSource && selectedSource.id !== 'area' ? selectedSource.name : "Select a display"}</span>
                                        </div>
                                        {selectedSource && selectedSource.id !== 'area' && <div className="absolute top-2 right-2 text-indigo-500"><CheckCircle className="w-4 h-4" /></div>}
                                    </button>

                                    <button
                                        onClick={handleSelectRegion}
                                        className={`group relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 overflow-hidden
                            ${selectedSource && selectedSource.id === 'area' ? 'border-purple-500 bg-purple-500/5' : 'border-slate-700 bg-slate-800/30 hover:border-purple-500/50 hover:bg-slate-800/50'}
                        `}
                                    >
                                        <div className={`p-3 rounded-lg transition-colors ${selectedSource && selectedSource.id === 'area' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-700 text-slate-300 group-hover:bg-purple-500 group-hover:text-white'}`}>
                                            <Crop className="w-6 h-6" />
                                        </div>
                                        <div className="text-center">
                                            <span className="block font-medium text-slate-200">Select Area</span>
                                            <span className="text-xs text-slate-400 mt-1">{selectedSource && selectedSource.id === 'area' ? selectedSource.name : "Record region"}</span>
                                        </div>
                                        {selectedSource && selectedSource.id === 'area' && <div className="absolute top-2 right-2 text-purple-500"><CheckCircle className="w-4 h-4" /></div>}
                                    </button>
                                </div>
                            ) : null
                        }

                        {/* Preview Video */}
                        {
                            previewUrl && (
                                <div className="space-y-6">
                                    <div className="rounded-xl overflow-hidden border border-slate-700 bg-black relative group shadow-2xl">
                                        <video src={previewUrl} controls className="w-full h-auto max-h-[300px]" />
                                    </div>

                                    {/* Share Buttons */}
                                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Share2 className="w-3 h-3" /> Share your creation
                                        </h3>
                                        <div className="grid grid-cols-4 gap-3">
                                            <button onClick={() => openShare('https://www.tiktok.com/upload')} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-800 hover:bg-[#000000] hover:text-white transition-all border border-slate-700 group hover:border-slate-600">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-slate-800 transition-colors text-slate-200">
                                                    <SocialIcon type="tiktok" className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-medium text-slate-400 group-hover:text-white">TikTok</span>
                                            </button>

                                            <button onClick={() => openShare('https://studio.youtube.com/channel/UC/videos/upload?d=ud')} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-800 hover:bg-[#FF0000]/10 hover:border-red-500/30 transition-all border border-slate-700 group">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-red-600 transition-colors text-slate-200 group-hover:text-white">
                                                    <Youtube className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-medium text-slate-400 group-hover:text-red-500">YouTube</span>
                                            </button>

                                            <button onClick={() => openShare('https://www.facebook.com/')} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-800 hover:bg-[#1877F2]/10 hover:border-blue-500/30 transition-all border border-slate-700 group">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-[#1877F2] transition-colors text-slate-200 group-hover:text-white">
                                                    <Facebook className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-medium text-slate-400 group-hover:text-[#1877F2]">Facebook</span>
                                            </button>

                                            <button onClick={() => handleDownload()} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-800 hover:bg-[#5865F2]/10 hover:border-indigo-500/30 transition-all border border-slate-700 group">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-[#5865F2] transition-colors text-slate-200 group-hover:text-white">
                                                    <SocialIcon type="discord" className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-medium text-slate-400 group-hover:text-[#5865F2]">Save & Post</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {/* AI Analysis & Trim Section */}
                        {
                            previewUrl && (
                                <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-xl p-5 border border-indigo-500/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" /> AI Operations
                                        </h3>
                                        <div className="flex gap-2">
                                            {!isTrimming && !suggestedTrim && (
                                                <button
                                                    onClick={handleSmartTrim}
                                                    className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                                                >
                                                    <Crop className="w-3 h-3" /> Smart Trim
                                                </button>
                                            )}

                                            {!aiAnalysis && !isAnalyzing && (
                                                <button
                                                    onClick={handleAnalyzeAI}
                                                    className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                                                >
                                                    <Sparkles className="w-3 h-3" /> Analyze Video
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {(isAnalyzing || isTrimming) && (
                                        <div className="flex items-center justify-center py-4 space-x-2 text-indigo-300 animate-pulse">
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            <span className="text-xs font-medium ml-2">
                                                {isTrimming ? "Autodetecting silence & cropping..." : "Generating Report..."}
                                            </span>
                                        </div>
                                    )}

                                    {isReplayMode && trimMessage && !suggestedTrim && (
                                        <div className="mb-4 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg flex items-center gap-2 text-sm text-indigo-400 animate-in fade-in slide-in-from-top-2">
                                            <CheckCircle className="w-4 h-4" />
                                            {trimMessage}
                                        </div>
                                    )}

                                    {trimMessage && (
                                        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-center gap-2 text-sm text-emerald-400 animate-in fade-in slide-in-from-top-2 justify-between">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                {trimMessage}
                                            </div>
                                            {suggestedTrim && (
                                                <button
                                                    onClick={applyTrim}
                                                    className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-md font-bold transition-colors shadow-lg shadow-emerald-500/20"
                                                >
                                                    Apply Cut
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {aiAnalysis && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div>
                                                <span className="text-xs text-slate-400 font-medium uppercase">Suggested Title</span>
                                                <p className="text-white font-medium">{aiAnalysis.title}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 font-medium uppercase">Summary</span>
                                                <p className="text-sm text-slate-300 leading-relaxed">{aiAnalysis.summary}</p>
                                            </div>
                                            <div>
                                                <span className="text-xs text-slate-400 font-medium uppercase">Tags</span>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {aiAnalysis.tags.map(tag => (
                                                        <span key={tag} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md border border-indigo-500/20">#{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        {/* Main Action Buttons */}
                        <div className="flex justify-center pt-2">
                            {previewUrl ? (
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition-all"
                                    >
                                        <Download className="w-5 h-5" />
                                        Save as File
                                    </button>
                                    <button
                                        onClick={() => { setPreviewUrl(null); setRecordedChunks([]); }}
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all"
                                    >
                                        <NewRecordingIcon className="w-5 h-5" />
                                        New Recording
                                    </button>
                                </div>
                            ) : isReplayMode ? (
                                <div className="flex gap-4 w-full">
                                    <button
                                        onClick={() => saveReplay()}
                                        disabled={!replayBufferActive}
                                        className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]
                                            ${replayBufferActive ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-indigo-500/30' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}
                                            text-white`}
                                    >
                                        <Download className="w-5 h-5" />
                                        {replayBufferActive ? 'Save Flashback' : 'Buffering...'}
                                    </button>
                                    <button
                                        onClick={handleStopRecording}
                                        className="flex items-center justify-center gap-2 px-6 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl font-semibold transition-all"
                                        title="Exit Flashback Mode"
                                    >
                                        <Square className="w-5 h-5 fill-current" />
                                    </button>
                                </div>
                            ) : isRecording ? (
                                <button
                                    onClick={handleStopRecording}
                                    className="flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]
                                        bg-red-500 hover:bg-red-600 shadow-red-500/30 text-white"
                                >
                                    <Square className="w-5 h-5 fill-current" />
                                    Stop Recording
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleStartRecording(null)}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]
                            ${selectedSource ? 'bg-white text-slate-900 shadow-white/10 hover:bg-slate-100' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}
                        `}
                                    disabled={!selectedSource}
                                >
                                    <div className={`w-3 h-3 rounded-full ${selectedSource ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                                    Start Recording
                                </button>
                            )}
                        </div>

                        {
                            error && (
                                <div className="text-center text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    {error}
                                </div>
                            )
                        }

                        {/* Saved Clips Library */}
                        {
                            savedClips.length > 0 && !previewUrl && (
                                <div className="pt-4 border-t border-slate-700/50">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Saved Clips</h3>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {savedClips.map((clip) => (
                                            <div key={clip.id} className="flex items-center gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/5 group hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all">
                                                <div className="relative w-24 h-16 bg-black rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
                                                    <video src={clip.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Play className="w-8 h-8 text-white drop-shadow-lg" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-slate-200 truncate group-hover:text-indigo-300 transition-colors">Flashback Clip</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        {clip.timestamp.toLocaleTimeString()}
                                                        <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                                        <span className="text-slate-400">{clip.duration}s</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            const a = document.createElement('a');
                                                            a.href = clip.url;
                                                            a.download = `flashback-${clip.id}.webm`;
                                                            document.body.appendChild(a);
                                                            a.click();
                                                            document.body.removeChild(a);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setSavedClips(prev => prev.filter(c => c.id !== clip.id))}
                                                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        }
                    </div >
                </div >
            </main >

            {/* Source Selection Modal */}
            {
                sourceSelectionModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-slate-900/90 border border-slate-700/50 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col ring-1 ring-white/10 backdrop-blur-xl overflow-hidden">
                            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-950/30">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <Monitor className="w-5 h-5 text-indigo-400" /> Select Source
                                </h2>
                                <button onClick={() => setSourceSelectionModal(null)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">✕</button>
                            </div>
                            <div className="p-8 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-900/30">
                                {sourceSelectionModal.map(src => (
                                    <button
                                        key={src.id}
                                        onClick={() => selectSource(src)}
                                        className="group flex flex-col gap-3 p-4 rounded-2xl border border-slate-700/50 bg-slate-950/40 hover:border-indigo-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-indigo-500/10 transition-all text-left ring-1 ring-transparent hover:ring-indigo-500/20"
                                    >
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 group-hover:border-indigo-500/30 transition-colors">
                                            <img src={src.thumbnail} alt={src.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                        </div>
                                        <span className="font-medium text-slate-300 group-hover:text-indigo-300 truncate w-full px-1">{src.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Premium Settings Modal */}
            {
                showSettings && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-slate-900/90 border border-slate-700/50 rounded-3xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden ring-1 ring-white/10 backdrop-blur-xl">

                            {/* Sidebar */}
                            <div className="w-64 bg-slate-950/50 border-r border-slate-700/50 p-6 flex flex-col gap-2">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-6 px-2">
                                    <Settings className="w-6 h-6 text-indigo-400" />
                                    <span>Settings</span>
                                </h2>

                                <button
                                    onClick={() => setSettingsTab('video')}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left
                                    ${settingsTab === 'video' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                                >
                                    <Film className="w-5 h-5" /> Video Quality
                                </button>
                                <button
                                    onClick={() => setSettingsTab('audio')}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left
                                    ${settingsTab === 'audio' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                                >
                                    <Volume2 className="w-5 h-5" /> Audio & Mic
                                </button>
                                <button
                                    onClick={() => setSettingsTab('ai')}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left
                                    ${settingsTab === 'ai' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                                >
                                    <Wand2 className="w-5 h-5" /> AI Features
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 flex flex-col bg-slate-900/30">
                                <div className="p-8 flex-1 overflow-y-auto">
                                    {settingsTab === 'video' && (
                                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-1">Recording Quality</h3>
                                                <p className="text-slate-400 text-sm mb-6">Adjust the resolution and smoothness of your recordings.</p>

                                                <div className="grid gap-6">
                                                    <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
                                                        <label className="block text-sm font-medium text-slate-300 mb-3">Resolution</label>
                                                        <select
                                                            value={videoResolution}
                                                            onChange={(e) => setVideoResolution(e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all hover:border-slate-600"
                                                        >
                                                            <option value="4k">4K Ultra HD (2160p)</option>
                                                            <option value="2k">2K Quad HD (1440p)</option>
                                                            <option value="1080p">Full HD (1080p)</option>
                                                            <option value="720p">HD (720p)</option>
                                                            <option value="480p">SD (480p)</option>
                                                        </select>
                                                    </div>

                                                    <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
                                                        <label className="block text-sm font-medium text-slate-300 mb-3">Webcam Source</label>
                                                        <select
                                                            value={selectedWebcamId}
                                                            onChange={(e) => setSelectedWebcamId(e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all hover:border-slate-600"
                                                        >
                                                            <option value="default">Default Webcam</option>
                                                            {videoInputDevices.map(device => (
                                                                <option key={device.deviceId} value={device.deviceId}>
                                                                    {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <p className="text-xs text-slate-500 mt-2">Webcam will appear as a picture-in-picture overlay during recording.</p>
                                                    </div>

                                                    <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
                                                        <label className="block text-sm font-medium text-slate-300 mb-3">Frame Rate</label>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[30, 60, 0].map(fps => (
                                                                <button
                                                                    key={fps}
                                                                    onClick={() => setFrameRate(fps)}
                                                                    className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all border
                                                                        ${frameRate === fps
                                                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                                                            : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}`}
                                                                >
                                                                    {fps === 0 ? 'Max FPS' : `${fps} FPS`}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-3">Higher frame rates result in smoother video but larger file sizes.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {settingsTab === 'audio' && (
                                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-1">Audio Configuration</h3>
                                                <p className="text-slate-400 text-sm mb-6">Manage input sources and audio fidelity.</p>

                                                <div className="grid gap-6">
                                                    <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
                                                        <label className="block text-sm font-medium text-slate-300 mb-3">Microphone Source</label>
                                                        <select
                                                            value={selectedMicId}
                                                            onChange={(e) => setSelectedMicId(e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all hover:border-slate-600"
                                                        >
                                                            <option value="default">Default System Microphone</option>
                                                            {audioDevices.map(device => (
                                                                <option key={device.deviceId} value={device.deviceId}>
                                                                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
                                                        <label className="block text-sm font-medium text-slate-300 mb-3">Audio Bitrate</label>
                                                        <select
                                                            value={audioBitrate}
                                                            onChange={(e) => setAudioBitrate(Number(e.target.value))}
                                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all hover:border-slate-600"
                                                        >
                                                            <option value="64000">Low Quality (64 kbps)</option>
                                                            <option value="128000">Standard (128 kbps)</option>
                                                            <option value="192000">High Quality (192 kbps)</option>
                                                            <option value="256000">Ultra Quality (256 kbps)</option>
                                                            <option value="320000">Studio Master (320 kbps)</option>
                                                        </select>
                                                    </div>

                                                    <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 flex items-center justify-between">
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-300 mb-1">Noise Suppression</label>
                                                            <p className="text-xs text-slate-500">Reduces background noise and echo for clearer voice.</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setNoiseSuppression(!noiseSuppression)}
                                                            className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out border border-transparent ${noiseSuppression ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                                        >
                                                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${noiseSuppression ? 'translate-x-6' : 'translate-x-0'}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {settingsTab === 'ai' && (
                                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-1">Artificial Intelligence</h3>
                                                <p className="text-slate-400 text-sm mb-6">Configure Google Gemini for smart recording analysis.</p>

                                                <div className="bg-slate-800/40 p-6 rounded-2xl border border-indigo-500/20 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                                        <Sparkles className="w-24 h-24 text-indigo-500 rotate-12" />
                                                    </div>

                                                    <label className="block text-sm font-medium text-indigo-300 mb-3">Gemini API Key</label>
                                                    <input
                                                        type="password"
                                                        value={apiKey}
                                                        onChange={(e) => setApiKey(e.target.value)}
                                                        placeholder="Enter your API key..."
                                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono tracking-wide"
                                                    />
                                                    <p className="text-xs text-slate-500 mt-4 leading-relaxed max-w-md">
                                                        This key unlocks Smart Trim and Auto-Labeling features.
                                                        Your key is stored securely in your local device storage.
                                                        <a href="#" onClick={() => openShare('https://aistudio.google.com/app/apikey')} className="block mt-2 text-indigo-400 hover:text-indigo-300 hover:underline">Get a free API key here &rarr;</a>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-slate-800 bg-slate-950/30 flex justify-end">
                                    <button
                                        onClick={() => setShowSettings(false)}
                                        className="px-8 py-3 bg-white text-slate-950 hover:bg-slate-200 rounded-xl font-bold transition-all transform hover:scale-[1.02] shadow-xl shadow-white/5 active:scale-[0.98]"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}

function NewRecordingIcon(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    )
}

export default App
