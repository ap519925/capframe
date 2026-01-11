# implementation Plan: AI Auto Trim

To implement a "Smart Trim" feature that automatically removes silence or setup time using AI, we need to bridge two technologies: **Google Gemini (Vision)** for analysis and **FFmpeg** for video processing.

## 1. The Strategy

### Part A: AI Analysis (Determining "Where" to Trim)
We cannot stream the entire video to Gemini efficiently in real-time (bandwidth/latency). Instead, we will use a "Sampling Strategy":
1.  **Extract Frames**: Grab a screenshot every 1 second for the first 10-15 seconds of the recording.
2.  **Prompt Gemini**: Send these 10-15 images to Gemini 1.5 Flash.
3.  **The Prompt**: *"Analyze these sequential frames (1 per second) from the start of a screen recording. Identify the index of the first frame where meaningful interaction starts (mouse movement, window opening, typing). Ignore a static desktop or 'start recording' UI. Return the start_time in seconds."*
4.  **Result**: Gemini returns `start_time: 4`.

### Part B: Video Processing (The "Cut")
Web browsers (and by extension Electron renderers) cannot easily "edit" video files without re-encoding them, which is slow and memory-intensive in JavaScript.
**Solution**: Use **FFmpeg** in the Electron Main process.
1.  **Install**: `npm install fluent-ffmpeg ffmpeg-static`
2.  **Backend**: Create an IPC handler `TRIM_VIDEO` that accepts `(inputPath, startTime, endTime)`.
3.  **Command**: It runs `ffmpeg -ss <start> -i <input> -c copy <output>` (using `-c copy` is nearly instant as it doesn't re-encode, just cuts).

## 2. Implementation Steps

### Step 1: Install Dependencies
We need the FFmpeg binaries provided by `ffmpeg-static` to ensure it works on Windows and in the final `.exe`.
```bash
npm install fluent-ffmpeg ffmpeg-static
```

### Step 2: Configure Electron (Main Process)
We need to expose the trimming functionality to the frontend.
*   **Import** `ffmpeg` and point it to the static binary.
*   **Handle IPC**: Listen for 'TRIM_VIDEO'.
*   **Path Handling**: Ensure the binary path is correct in both "Dev" and "Production" (ASAR) modes.

### Step 3: Frontend AI Logic (`App.jsx`)
Update the `handleSmartTrim` function:
1.  **Generate Sequence**: Instead of 3 random frames, generate logical sequence: `[0s, 1s, 2s, 3s, 4s, 5s]`.
2.  **Call Gemini**: Get the suggested `startTime`.
3.  **User Review**: Show a UI: *"AI suggests trimming the first 4 seconds. [Apply] [Cancel]"*
4.  **Execute**: Send the trim command to the main process.

## 3. Potential Challenges
*   **Build Size**: FFmpeg adds ~15-20MB to the application size.
*   **Binary Packing**: Configuring `electron-builder` to correctly unpack `ffmpeg.exe` is critical, otherwise it will fail after installation. Use `asar.unpack` configuration.

## 4. Immediate Next Step
If you approve, I can:
1.  Install the FFmpeg dependencies.
2.  Configure the build system.
3.  Implement the AI detection and Trimming logic.
