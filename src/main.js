let mediaRecorder;
let recordedChunks = [];
let stream;

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const previewArea = document.getElementById('previewContainer');
const previewVideo = document.getElementById('previewVideo');
const downloadBtn = document.getElementById('downloadBtn');
const newRecordingBtn = document.getElementById('newRecordingBtn');
const statusIndicator = document.getElementById('recordingStatus');
const timerDisplay = document.getElementById('timer');
const audioToggle = document.getElementById('audioToggle');
const app = document.getElementById('app');

let timerInterval;
let startTime;

startBtn.addEventListener('click', async () => {
  // If we are in Electron (window.electronAPI exists), use the source picker
  if (window.electronAPI) {
    await showSourcePicker();
  } else {
    // Fallback for browser (during dev without electron)
    try {
      const audioEnabled = audioToggle.checked;
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: audioEnabled
      });
      handleStream(stream);
    } catch (err) {
      console.error("Error starting capture:", err);
    }
  }
});

async function showSourcePicker() {
  const sources = await window.electronAPI.getSources();

  // Create modal elements
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const content = document.createElement('div');
  content.className = 'modal-content';

  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `<h2>Select an Area / Screen</h2><button class="close-btn">×</button>`;

  const grid = document.createElement('div');
  grid.className = 'sources-grid';

  sources.forEach(source => {
    const item = document.createElement('div');
    item.className = 'source-item';
    item.onclick = () => selectSource(source.id, overlay);

    const thumb = document.createElement('img');
    thumb.className = 'source-thumbnail';
    thumb.src = source.thumbnail;

    const name = document.createElement('div');
    name.className = 'source-name';
    name.textContent = source.name;

    item.appendChild(thumb);
    item.appendChild(name);
    grid.appendChild(item);
  });

  content.appendChild(header);
  content.appendChild(grid);
  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Close handler
  header.querySelector('.close-btn').onclick = () => {
    document.body.removeChild(overlay);
  };
}

async function selectSource(sourceId, overlay) {
  document.body.removeChild(overlay);

  try {
    const audioEnabled = audioToggle.checked;

    // Electron specific getUserMedia constraints
    const constraints = {
      audio: audioEnabled ? {
        mandatory: {
          chromeMediaSource: 'desktop'
        }
      } : false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId
        }
      }
    };

    stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleStream(stream);
  } catch (e) {
    console.error('Failed to get user media', e);
  }
}

function handleStream(inputStream) {
  stream = inputStream;

  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  mediaRecorder.start();

  startTimer();
  updateUIState(true);
}

function handleDataAvailable(event) {
  if (event.data.size > 0) {
    recordedChunks.push(event.data);
  }
}

function handleStop() {
  stopTimer();
  const blob = new Blob(recordedChunks, {
    type: 'video/webm'
  });
  const url = URL.createObjectURL(blob);

  previewVideo.src = url;

  downloadBtn.onclick = () => {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    a.download = `recording-${new Date().toISOString().replace(/:/g, '-')}.webm`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  updateUIState(false);

  // Stop all tracks
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

stopBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
});

newRecordingBtn.addEventListener('click', () => {
  recordedChunks = [];
  previewVideo.src = '';
  previewArea.classList.add('hidden');
  startBtn.classList.remove('hidden');
});

function updateUIState(isRecording) {
  if (isRecording) {
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    statusIndicator.classList.remove('hidden');
    previewArea.classList.add('hidden');
  } else {
    startBtn.classList.add('hidden'); // Stay hidden, show preview instructions
    stopBtn.classList.add('hidden');
    statusIndicator.classList.add('hidden');
    previewArea.classList.remove('hidden');
  }
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    const seconds = Math.floor((elapsedTime / 1000) % 60);
    const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);

    const formattedTime =
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    timerDisplay.textContent = formattedTime;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerDisplay.textContent = "00:00";
}
