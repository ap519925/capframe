# Capframe - Smart Screen Recorder

Capframe is a modern, high-performance screen recording application built with Electron and React. It utilizes the latest web technologies to provide a smooth, aesthetic, and functional recording experience.

## Features

*   **⚡ High Performance**: Low latency recording with up to 60 FPS.
*   **🎥 Smart Recording**: Capture full screen or select specific regions easily.
*   **⏪ Flashback Mode**: Always recording in the background? No! But Flashback buffers video so you can save the last 30-180 seconds instantly. never miss a moment.
*   **🤖 AI Integration**: Built-in integration with Google Gemini 1.5 Flash to automatically detect "meaningful" start times and ignore setup/silence.
*   **✂️ Smart Trim**: Instantly cut the silence from the start of your video without re-encoding, using our integrated FFmpeg engine.
*   **🎙️ Audio Mixing**: Seamlessly capture System Audio and Microphone simultaneously.
*   **🎨 Beautiful UI**: Glassmorphism design with a dark mode aesthetic.

## Installation

Download the latest installer from our [Releases](https://github.com/ap519925/capframe/releases) page.

## Documentation regarding Windows Store Submission

For details regarding Installer executable return codes (often required for Microsoft Store submission), please refer to:
*   [Installer Return Codes Documentation](./INSTALLER_RETURN_CODES.md)

This documentation provides the specific standard return codes (success, disk full, user cancelled, etc.) used by our NSIS installer.

## Development

1.  Clone the repo
2.  Install dependencies: `npm install`
3.  Run dev server: `npm run dev`
4.  Run Electron: `npm run start:electron`

## License

Copyright © 2026. All rights reserved.
