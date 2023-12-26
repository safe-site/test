document.addEventListener('DOMContentLoaded', () => {
  let mediaRecorder;
  let audioChunks = [];
  const recordingsList = document.getElementById('recordingsList');
  const toggleRecordingButton = document.getElementById('toggleRecording');

  let isRecording = false;

  toggleRecordingButton.addEventListener('click', () => {
    if (isRecording) {
      stopRecording();
      toggleRecordingButton.textContent = 'Start Recording';
    } else {
      startRecording();
      toggleRecordingButton.textContent = 'Stop Recording';
    }

    isRecording = !isRecording;
  });

  // Initialize IndexedDB
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
      <p>Name: ${name}</p>
      <audio controls src="${audioUrl}"></audio>
    `;

    recordingItem.addEventListener('click', () => {
      playRecording(audioUrl);
    });

    // Insert the new recording at the beginning of the list
    const firstRecordingItem = recordingsList.firstChild;
    recordingsList.insertBefore(recordingItem, firstRecordingItem);
  }

  function playRecording(audioUrl) {
    const audioElement = new Audio(audioUrl);
    audioElement.play();
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const currentDate = new Date();
        const formattedDate = formatDate(currentDate);

        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        createRecordingItem(audioBlob, formattedDate);

        // Save the recording to IndexedDB
        saveRecordingToDB(audioBlob, formattedDate);

        audioChunks = [];
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }

  function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    return `${day}/${month}/${year} ${hours % 12 || 12}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds} ${ampm}`;
  }

  // Load existing recordings from IndexedDB on page load
  loadRecordingsFromDB();
});
