document.addEventListener('DOMContentLoaded', () => {
  let mediaRecorder;
  let audioChunks = [];
  const recordingsList = document.getElementById('recordingsList');
  const toggleRecordingButton = document.getElementById('toggleRecording');
  const recordingProgress = document.getElementById('recordingProgress');
  const progressBarContainer = document.getElementById('progressBarContainer');

  let isRecording = false;
  let startTime;
  let updateRecordingProgress;
  let audioElement; // Declare audioElement here

  toggleRecordingButton.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
      toggleRecordingButton.textContent = 'stop_circle';
      toggleRecordingButton.style.color = 'red';
    } else {
      startRecording();
      toggleRecordingButton.textContent = 'check_circle';
      toggleRecordingButton.style.color = 'green';
    }

    isRecording = !isRecording;
  });

  const dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open('VoiceRecorderDB', 1);

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event.target.error);
      reject(event.target.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('recordings')) {
        db.createObjectStore('recordings', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
  });

  function saveRecordingToDB(audioBlob, name) {
    dbPromise.then((db) => {
      const transaction = db.transaction(['recordings'], 'readwrite');
      const store = transaction.objectStore('recordings');

      const recording = { audioBlob: audioBlob, name: name };

      store.add(recording);
    });
  }

  function loadRecordingsFromDB() {
    dbPromise.then((db) => {
      const transaction = db.transaction(['recordings'], 'readonly');
      const store = transaction.objectStore('recordings');

      const getAll = store.getAll();

      getAll.onsuccess = (event) => {
        const recordings = event.target.result;
        recordings.forEach((recording) => {
          createRecordingItem(recording.audioBlob, recording.name);
        });
      };
    });
  }

  function createRecordingItem(audioBlob, name) {
    const audioUrl = URL.createObjectURL(audioBlob);

    const recordingItem = document.createElement('div');
    recordingItem.classList.add('recordedItem');
    recordingItem.innerHTML = `
      <div class="left-section">
        <button class="playPauseButton" data-src="${audioUrl}">&#9658;</button>
      </div>
      <div class="right-section">
        <p class="name">${name}</p>
        <p class="additionalDate">${getAdditionalDate()}</p>
      </div>
    `;

    recordingItem.addEventListener('click', (event) => {
      if (event.target.classList.contains('playPauseButton')) {
        handlePlayPauseClick(event.target);
      }
    });

    const firstRecordingItem = recordingsList.firstChild;
    recordingsList.insertBefore(recordingItem, firstRecordingItem);
  }

  function handlePlayPauseClick(button) {
    const audioUrl = button.getAttribute('data-src');

    if (!audioElement || audioElement.src !== audioUrl) {
      audioElement = new Audio(audioUrl);
    }

    if (audioElement.paused) {
      audioElement.play();
      button.innerHTML = '&#9646;&#9646;'; // Pause symbol
      showProgressBar();
    } else {
      audioElement.pause();
      button.innerHTML = '&#9658;'; // Play symbol
      hideProgressBar();
    }
  }

  function showProgressBar() {
    progressBarContainer.style.display = 'block';
    updateProgressBar();
  }

  function hideProgressBar() {
    progressBarContainer.style.display = 'none';
    clearInterval(updateRecordingProgress);
  }

  function updateProgressBar() {
    updateRecordingProgress = setInterval(() => {
      const currentTime = audioElement.currentTime;
      const duration = audioElement.duration;
      const progress = (currentTime / duration) * 100;
      recordingProgress.style.width = `${progress}%`;

      if (currentTime >= duration) {
        hideProgressBar();
      }
    }, 100);
  }

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const currentDate = new Date();
          const formattedDate = formatDateTime(currentDate);

          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          createRecordingItem(audioBlob, formattedDate);

          saveRecordingToDB(audioBlob, formattedDate);

          audioChunks = [];
          recordingProgress.style.width = '0';
          clearInterval(updateRecordingProgress);
        };

        mediaRecorder.start();
        startTime = performance.now();

        updateRecordingProgress = setInterval(() => {
          const currentTime = performance.now();
          const elapsedTime = currentTime - startTime;
          const minutes = Math.floor(elapsedTime / 60000);
          const seconds = Math.floor((elapsedTime % 60000) / 1000);
          const milliseconds = Math.floor((elapsedTime % 1000) / 10);
          recordingProgress.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')}`;
        }, 10); // Update every 10 milliseconds for better accuracy
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
      });
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      const tracks = mediaRecorder.stream.getTracks();
      tracks.forEach(track => track.stop());
      clearInterval(updateRecordingProgress);
    }
  }

  function formatDateTime(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(2);
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    return `${month} ${day}, ${hours % 12 || 12}:${minutes} ${ampm}`;
  }

  function getAdditionalDate() {
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = String(currentDate.getFullYear()).slice(2);

    return `${day}/${month}/${year}`;
  }

  // Load existing recordings from IndexedDB on page load
  loadRecordingsFromDB();
});
