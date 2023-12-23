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

  function createRecordingItem(audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);

    const recordingItem = document.createElement('div');
    recordingItem.classList.add('recordedItem');
    recordingItem.innerHTML = `<audio controls src="${audioUrl}"></audio>`;

    recordingItem.addEventListener('click', () => {
      playRecording(audioUrl);
    });

    recordingsList.appendChild(recordingItem);

    // Save the recording to local storage
    saveRecordingToStorage(audioUrl);
  }

  function saveRecordingToStorage(audioUrl) {
    const storedRecordings = JSON.parse(localStorage.getItem('recordings')) || [];
    storedRecordings.push(audioUrl);
    localStorage.setItem('recordings', JSON.stringify(storedRecordings));
  }

  function loadRecordingsFromStorage() {
    const storedRecordings = JSON.parse(localStorage.getItem('recordings')) || [];
    storedRecordings.forEach((audioUrl) => {
      createRecordingItemFromStorage(audioUrl);
    });
  }

  function createRecordingItemFromStorage(audioUrl) {
    const recordingItem = document.createElement('div');
    recordingItem.classList.add('recordedItem');
    recordingItem.innerHTML = `<audio controls src="${audioUrl}"></audio>`;

    recordingItem.addEventListener('click', () => {
      playRecording(audioUrl);
    });

    recordingsList.appendChild(recordingItem);
  }

  function playRecording(audioUrl) {
    const audioElement = new Audio(audioUrl);
    document.body.appendChild(audioElement); // Append the audio element to the document
    audioElement.play();
    audioElement.addEventListener('ended', () => {
      document.body.removeChild(audioElement); // Remove the audio element once it has finished playing
    });
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
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        createRecordingItem(audioBlob);

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

  // Load existing recordings from local storage on page load
  loadRecordingsFromStorage();
});
