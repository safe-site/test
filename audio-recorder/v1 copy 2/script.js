document.addEventListener('DOMContentLoaded', () => {
  let mediaRecorder;
  let audioChunks = [];
  const recordingsList = document.getElementById('recordingsList');
  const toggleRecordingButton = document.getElementById('toggleRecording');
  const recordingProgress = document.getElementById('recordingProgress');

  let isRecording = false;
  let startTime;
  let updateRecordingProgress;
  let audioElement;
  let touchStartX;
  let touchEndX;

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  toggleRecordingButton.addEventListener('click', () => {
    const toggleRecordingImg = document.getElementById('toggleRecordingImg');

    if (isRecording) {
      stopRecording();
      toggleRecordingImg.src = 'assets/images/start-recording.png';
      toggleRecordingButton.style.color = 'red';
    } else {
      startRecording();
      toggleRecordingImg.src = 'assets/images/stop-recording.png';
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
          createRecordingItem(recording.audioBlob, recording.name, recording.id);
        });
      };
    });
  }

  function createRecordingItem(audioBlob, name, id) {
    const audioUrl = URL.createObjectURL(audioBlob);

    const recordingItem = document.createElement('div');
    recordingItem.classList.add('recordedItem');
    recordingItem.dataset.recordingId = id;
    recordingItem.innerHTML = `
      <div class="audio-box">
        <div class="left-section">
          <button class="playPauseButton" data-src="${audioUrl}" data-state="paused"></button>
          <input type="range" class="audioSlider" value="0" min="0" step="0.01" />
          <div class="timeDisplay">
            <span class="currentTime">0:00</span> / <span class="totalDuration">0:00</span>
          </div>
        </div>
        <div class="right-section">
          <p class="name">${name}</p>
          <p class="additionalDate">${getAdditionalDate()}</p>
        </div>
      </div>
    `;

    recordingItem.addEventListener('click', (event) => {
      if (event.target.classList.contains('playPauseButton')) {
        handlePlayPauseClick(event.target);
      }
    });

    recordingItem.addEventListener('touchstart', handleTouchStart);
    recordingItem.addEventListener('touchend', handleTouchEnd);

    const firstRecordingItem = recordingsList.firstChild;
    recordingsList.insertBefore(recordingItem, firstRecordingItem);

    // Add event listener for the playback slider
    const audioSlider = recordingItem.querySelector('.audioSlider');
    audioSlider.addEventListener('input', () => {
      handleSliderChange(audioSlider);
    });
  }

  function handleSliderChange(slider) {
    if (audioElement) {
      const newTime = audioElement.duration * (slider.value / 100);
      audioElement.currentTime = newTime;
    }
  }

  function updatePlaybackProgress() {
    if (audioElement) {
      const currentTimeElement = document.querySelector('.currentTime');
      const totalDurationElement = document.querySelector('.totalDuration');

      currentTimeElement.textContent = formatTime(audioElement.currentTime);
      totalDurationElement.textContent = formatTime(audioElement.duration);

      const audioSlider = document.querySelector('.audioSlider');
      audioSlider.value = (audioElement.currentTime / audioElement.duration) * 100;
    }
  }

  function handlePlayPauseClick(button) {
    const audioUrl = button.getAttribute('data-src');
    const currentState = button.getAttribute('data-state');

    if (!audioElement || audioElement.src !== audioUrl) {
      audioElement = new Audio(audioUrl);
    }

    if (currentState === 'paused') {
      audioElement.play();
      button.classList.remove('play');
      button.classList.add('pause');
      button.setAttribute('data-state', 'playing');
      updateRecordingProgress = setInterval(updatePlaybackProgress, 1000);
    } else {
      audioElement.pause();
      button.classList.remove('pause');
      button.classList.add('play');
      button.setAttribute('data-state', 'paused');
      clearInterval(updateRecordingProgress);
    }
  }

  function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
  }

  function handleTouchEnd(event) {
    touchEndX = event.changedTouches[0].clientX;
    const swipedItem = event.target.closest('.recordedItem');
    handleSwipe(swipedItem);
  }

  function handleSwipe(item) {
    const swipeThreshold = 50;
    const deltaX = touchEndX - touchStartX;

    if (deltaX < -swipeThreshold) {
      confirmDeleteRecording(item);
    } else if (deltaX > swipeThreshold) {
      downloadRecording(item);
    }
  }

  function confirmDeleteRecording(item) {
    const name = item.querySelector('.name').textContent;
    const confirmation = window.confirm(`Are you sure you want to delete "${name}"?`);

    if (confirmation) {
      deleteRecordingItem(item);
    }
  }

  function downloadRecording(item) {
    const name = item.querySelector('.name').textContent;
    const audioUrl = item.querySelector('.playPauseButton').getAttribute('data-src');
    const blob = fetch(audioUrl).then(response => response.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  function deleteRecordingItem(itemToDelete) {
    if (itemToDelete) {
      const recordingId = parseInt(itemToDelete.dataset.recordingId);
      deleteRecordingFromDB(recordingId);

      itemToDelete.remove();
    }
  }

  function deleteRecordingFromDB(recordingId) {
    dbPromise.then((db) => {
      const transaction = db.transaction(['recordings'], 'readwrite');
      const store = transaction.objectStore('recordings');

      store.delete(recordingId);
    });
  }

  function updateRecordingProgressIndicator() {
    const currentTime = performance.now() - startTime;
    const minutes = Math.floor(currentTime / 60000);
    const seconds = Math.floor((currentTime % 60000) / 1000);
    const milliseconds = Math.floor((currentTime % 1000) / 10);
    recordingProgress.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(milliseconds).padStart(2, '0')}`;
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
          recordingProgress.textContent = '00:00:00';
          clearInterval(updateRecordingProgress);
        };

        mediaRecorder.start();
        startTime = performance.now();

        updateRecordingProgress = setInterval(updateRecordingProgressIndicator, 10);
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
      });
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      clearInterval(updateRecordingProgress);

      // Stop microphone access
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
    }
  }

  function formatDateTime(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    const formattedDate = `${months[date.getMonth()]} ${date.getDate()}, ${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds} ${ampm}`;
    return formattedDate;
  }

  function getAdditionalDate() {
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${String(year).substring(2)}`;
  }

  // Load existing recordings from IndexedDB on page load
  loadRecordingsFromDB();
});
