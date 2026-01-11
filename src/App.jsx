import React, { useState, useRef, useEffect } from 'react';
import { Monitor, Crop, CheckCircle, Square, Play, Download, Settings, Mic, MicOff, Video, Sliders, Share2, Youtube, Facebook, UploadCloud, Sparkles, Rewind, Clock, Laptop } from 'lucide-react';

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
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || 'AIzaSyBDTFMYIWpckHC714g2dFiXg9fsWdBLK0I');

    // Audio Settings
    const [audioBitrate, setAudioBitrate] = useState(128000); // 128 kbps default
    const [selectedMicId, setSelectedMicId] = useState('default');
    const [audioDevices, setAudioDevices] = useState([]);

    // Video Settings
    const [videoResolution, setVideoResolution] = useState('1080p'); // 4k, 2k, 1080p, 720p, 480p
    const [frameRate, setFrameRate] = useState(60); // 30, 60, 0 (Native/Max)

    useEffect(() => {
        const getDevices = async () => {
            try {
                // Request permission first to get labels
                await navigator.mediaDevices.getUserMedia({ audio: true });
                const devices = await navigator.mediaDevices.enumerateDevices();
                const mics = devices.filter(d => d.kind === 'audioinput');
                setAudioDevices(mics);
            } catch (e) {
                console.warn("Failed to enumerate audio devices:", e);
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

    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Refs for hotkey logic
    const isRecordingRef = useRef(isRecording);
    const selectedSourceRef = useRef(selectedSource);
    const replayBufferActiveRef = useRef(replayBufferActive);
    const replayDurationRef = useRef(replayDuration);

    const initialChunkRef = useRef(null);
    const recordingStartTimeRef = useRef(0);

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

    const createCroppedStream = (originalStream, rect) => {
        // ... (Keep existing implementation, but remove audio handling from here since we'll mix it at top level)
        // Actually, we can just return the video part here and add audio later
        const videoTrack = originalStream.getVideoTracks()[0];
        const { width: videoWidth, height: videoHeight } = videoTrack.getSettings();

        // Calculate scaling factor between logical pixels (rect) and physical pixels (video stream)
        const scaleX = videoWidth / window.screen.width;
        const scaleY = videoHeight / window.screen.height;

        const scaledRect = {
            x: rect.x * scaleX,
            y: rect.y * scaleY,
            width: rect.width * scaleX,
            height: rect.height * scaleY
        };

        const canvas = document.createElement('canvas');
        canvas.width = scaledRect.width;
        canvas.height = scaledRect.height;
        const ctx = canvas.getContext('2d');
        const video = document.createElement('video');
        video.srcObject = originalStream;
        video.muted = true;

        // Critical Fix: Append to DOM to ensure playback continues in background/when scaling
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.opacity = '0';
        video.style.pointerEvents = 'none';
        video.style.zIndex = '-1';
        document.body.appendChild(video);

        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();

                const draw = () => {
                    if (video.paused || video.ended) return;
                    ctx.drawImage(
                        video,
                        scaledRect.x, scaledRect.y, scaledRect.width, scaledRect.height, // Source
                        0, 0, scaledRect.width, scaledRect.height // Destination
                    );
                    animationFrameRef.current = requestAnimationFrame(draw);
                };
                draw();

                const stream = canvas.captureStream(60);

                // Cleanup when stream ends
                const cleanup = () => {
                    if (video.parentNode) {
                        document.body.removeChild(video);
                    }
                    if (animationFrameRef.current) {
                        cancelAnimationFrame(animationFrameRef.current);
                    }
                };

                stream.getVideoTracks()[0].onended = cleanup;
                // Also hook into the original stream ending if possible, but the local track stop usually triggers this.

                resolve(stream);
            };
        });
    };

    const handleStartRecording = async (sourceOverride) => {
        try {
            const sourceToUse = sourceOverride || selectedSource;

            if (!sourceToUse) {
                await handleSelectScreen();
                return;
            }

            if (sourceOverride) {
                setSelectedSource(sourceOverride);
            }

            // Sync state for immediate logic
            const sourceId = sourceToUse.id;

            // Start Countdown (UI State, not logic)
            // We defer visual "Recording" state until after countdown, but we do need to block multiple clicks

            setError(null);
            setRecordedChunks([]);
            setPreviewUrl(null);
            setAiAnalysis(null); // Reset AI
            setTrimMessage(null); // Reset Trim
            setTrimMessage(null); // Reset Trim
            initialChunkRef.current = null; // Reset Header

            // ... (keep stream setup)
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

            let videoStream = await navigator.mediaDevices.getUserMedia({
                audio: audioConstraints,
                video: videoConstraints
            });

            // Crop if needed
            if (sourceToUse.id === 'area' && sourceToUse.rect) {
                // When we scale/crop, we lose the audio track from the original videoStream if we just take canvas stream
                // So we need to preserve it.
                const croppedVideoStream = await createCroppedStream(videoStream, sourceToUse.rect);
                // The cropped stream has no audio. We add it back later if main stream had it.
                // We keep 'videoStream' as the source of audio.
                // But we use 'croppedVideoStream' for video tracks.
                // Actually, let's swap the video track.
                const combined = new MediaStream();
                croppedVideoStream.getVideoTracks().forEach(t => combined.addTrack(t));
                videoStream.getAudioTracks().forEach(t => combined.addTrack(t));
                videoStream = combined;
            }

            // 2. Mix Mic Audio if enabled
            const audioContext = new AudioContext();
            const dest = audioContext.createMediaStreamDestination();
            let hasAudioMixing = false;

            // Verify if we got system audio from the main call
            if (videoStream.getAudioTracks().length > 0) {
                const sysSrc = audioContext.createMediaStreamSource(videoStream);
                sysSrc.connect(dest);
                hasAudioMixing = true;
            }

            if (micEnabled) {
                try {
                    const micConstraints = {
                        audio: {
                            deviceId: selectedMicId !== 'default' ? { exact: selectedMicId } : undefined
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

            // 3. Final Stream Assembly
            const finalStream = new MediaStream();
            videoStream.getVideoTracks().forEach(track => finalStream.addTrack(track));

            if (hasAudioMixing) {
                // Use the mixed audio track
                dest.stream.getAudioTracks().forEach(track => finalStream.addTrack(track));
            } else if (videoStream.getAudioTracks().length > 0) {
                // If we didn't use audioContext mix for some reason but have system audio (e.g. mic was off), use it directly
                // But above logic covers this.
            }

            setStream(finalStream);

            // COUNTDOWN LOGIC
            // Only countdown for standard recording, not replay mode (unless desired, but user asked for "recording starts")
            // Assuming Flashback is always on/passive, so maybe no countdown needed? 
            // The prompt says "before the recording starts", implying the active recording session.
            // Let's do it for both to be safe/consistent, or check isReplayMode.
            // Actually flashback mode buffer starts immediately usually. 
            // Let's add countdown for Standard Mode mainly.

            if (!isReplayMode) {
                setCountdown(2);
                await new Promise(r => setTimeout(r, 1000));
                setCountdown(1);
                await new Promise(r => setTimeout(r, 1000));
                setCountdown(null);
            }

            // Show Overlay NOW (after countdown)
            if (window.electronAPI && window.electronAPI.showOverlay) {
                window.electronAPI.showOverlay(isReplayMode ? 'replay' : 'record');
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

            if (isReplayMode) {
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
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">

            {/* Countdown Overlay */}
            {countdown !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="text-9xl font-black text-white animate-bounce drop-shadow-[0_0_50px_rgba(255,255,255,0.5)]">
                        {countdown}
                    </div>
                </div>
            )}

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 container mx-auto px-6 py-8 flex items-center justify-center min-h-screen">
                <div className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">

                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/60">
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
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">

                        {/* Status & Timer */}
                        {/* Status & Timer */}
                        <div className="flex flex-col items-center justify-center space-y-2">
                            {/* Replay Mode Toggle */}
                            {!isRecording && !replayBufferActive && (
                                <div className="flex gap-2 mb-4 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                                    <button
                                        onClick={() => {
                                            setIsReplayMode(false);
                                            handleStopRecording(); // Stop buffer if running
                                        }}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isReplayMode ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        Standard Recording
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsReplayMode(true);
                                            // Auto-start buffer logic handled below or via effect, but simpler here:
                                            if (window.electronAPI.getSources && window.electronAPI.getCurrentScreenId) {
                                                Promise.all([window.electronAPI.getSources(), window.electronAPI.getCurrentScreenId()])
                                                    .then(([sources, currentId]) => {
                                                        const target = sources.find(s => s.id === currentId) || sources[0];
                                                        handleStartRecording(target);
                                                    })
                                                    .catch(err => {
                                                        console.error("Auto-start buffer failed:", err);
                                                        // Fallback manual will be shown
                                                    });
                                            } else {
                                                handleStartRecording(selectedSource);
                                            }
                                        }}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${isReplayMode ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <Rewind className="w-3 h-3" /> Flashback Mode
                                    </button>
                                </div>
                            )}

                            {isReplayMode ? (
                                <div className="min-h-[80px] flex flex-col items-center justify-center gap-2">
                                    <div className={`text-xl font-medium tracking-wide ${replayBufferActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                                        {replayBufferActive ? 'Flashback Active' : 'Flashback Ready'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            {[30, 60].map(dur => (
                                                <button
                                                    key={dur}
                                                    onClick={() => setReplayDuration(dur)}
                                                    className={`px-3 py-1 rounded text-xs font-bold border transition-all
                                                    ${replayDuration === dur
                                                            ? 'bg-indigo-500 border-indigo-500 text-white'
                                                            : 'border-slate-700 text-slate-400 hover:border-slate-500'
                                                        }
                                                `}
                                                >
                                                    {dur}s Back
                                                </button>
                                            ))}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1">
                                            Use <span className="text-slate-300 font-mono">Alt+Shift+S</span> to save last {replayDuration < 60 ? `${replayDuration}s` : `${replayDuration / 60}m`}
                                        </div>
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
                        {!isRecording && !previewUrl ? (
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
                        ) : null}

                        {/* Preview Video */}
                        {previewUrl && (
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
                        )}

                        {/* AI Analysis & Trim Section */}
                        {previewUrl && (
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
                        )}

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

                        {error && (
                            <div className="text-center text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                {error}
                            </div>
                        )}

                        {/* Saved Clips Library */}
                        {savedClips.length > 0 && !previewUrl && (
                            <div className="pt-4 border-t border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Saved Clips</h3>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {savedClips.map((clip) => (
                                        <div key={clip.id} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 group hover:border-indigo-500/30 transition-all">
                                            <div className="relative w-24 h-16 bg-black rounded-lg overflow-hidden shrink-0">
                                                <video src={clip.url} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Play className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-slate-200 truncate">Flashback Clip</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                    <Clock className="w-3 h-3" />
                                                    {clip.timestamp.toLocaleTimeString()}
                                                    <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                                    {clip.duration}s
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
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
                        )}
                    </div>
                </div>
            </main >

            {/* Source Selection Modal */}
            {
                sourceSelectionModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Select Screen</h2>
                                <button onClick={() => setSourceSelectionModal(null)} className="text-slate-400 hover:text-white transition-colors">✕</button>
                            </div>
                            <div className="p-6 overflow-y-auto grid grid-cols-2 gap-4">
                                {sourceSelectionModal.map(src => (
                                    <button
                                        key={src.id}
                                        onClick={() => selectSource(src)}
                                        className="group flex flex-col gap-3 p-4 rounded-xl border border-slate-700 bg-slate-900/50 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-left"
                                    >
                                        <img src={src.thumbnail} alt={src.name} className="w-full aspect-video object-cover rounded-lg border border-slate-700 group-hover:border-indigo-500/50" />
                                        <span className="font-medium text-slate-200 group-hover:text-indigo-400 truncate w-full">{src.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Settings Modal */}
            {
                showSettings && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/60">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Settings className="w-5 h-5" /> Settings
                                </h2>
                                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Google Gemini API Key</label>
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="AI..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        Required for AI Analysis features. Get a free key at <a href="#" onClick={() => openShare('https://aistudio.google.com/app/apikey')} className="text-indigo-400 hover:underline">Google AI Studio</a>.
                                        The key is stored locally on your device.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Audio Settings</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Microphone Source</label>
                                        <select
                                            value={selectedMicId}
                                            onChange={(e) => setSelectedMicId(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                        >
                                            <option value="default">Default Microphone</option>
                                            {audioDevices.map(device => (
                                                <option key={device.deviceId} value={device.deviceId}>
                                                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Sound Quality (Bitrate)</label>
                                        <select
                                            value={audioBitrate}
                                            onChange={(e) => setAudioBitrate(Number(e.target.value))}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                        >
                                            <option value="64000">Low (64 kbps)</option>
                                            <option value="128000">Standard (128 kbps)</option>
                                            <option value="192000">High (192 kbps)</option>
                                            <option value="256000">Ultra (256 kbps)</option>
                                            <option value="320000">Studio (320 kbps)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-700">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Video Quality</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Resolution</label>
                                        <select
                                            value={videoResolution}
                                            onChange={(e) => setVideoResolution(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                        >
                                            <option value="4k">4K (2160p)</option>
                                            <option value="2k">2K (1440p)</option>
                                            <option value="1080p">Full HD (1080p)</option>
                                            <option value="720p">HD (720p)</option>
                                            <option value="480p">SD (480p)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Frame Rate</label>
                                        <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1">
                                            {[30, 60, 0].map(fps => (
                                                <button
                                                    key={fps}
                                                    onClick={() => setFrameRate(fps)}
                                                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all
                                                        ${frameRate === fps ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                                                >
                                                    {fps === 0 ? 'Max / Native' : `${fps} FPS`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-700 flex justify-end">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Save & Close
                            </button>
                        </div>
                    </div>
                )}
        </div>
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
