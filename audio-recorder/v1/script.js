document.addEventListener('DOMContentLoaded', () => {
  const recordingsList = document.getElementById('recordingsList');
  const toggleRecordingButton = document.getElementById('toggleRecording');

  let mediaRecorder;
  let audioChunks = [];

  // Load existing recordings from local storage
  loadRecordingsFromLocalStorage();

  toggleRecordingButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  });

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
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);

          // Save the recording URL to local storage
          saveRecordingToLocalStorage(audioUrl);

          // Create a new recording item
          createAndAppendRecordingItem(audioUrl);

          audioChunks = []; // Clear the chunks for the next recording
        };

        mediaRecorder.start();
        toggleRecordingButton.textContent = 'Stop Recording';
      })
      .catch((error) => {
        console.error('Error starting recording:', error);
      });
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      toggleRecordingButton.textContent = 'Start Recording';
    }
  }

  function saveRecordingToLocalStorage(audioUrl) {
    const existingRecordings = JSON.parse(localStorage.getItem('recordings')) || [];
    existingRecordings.push(audioUrl);
    localStorage.setItem('recordings', JSON.stringify(existingRecordings));
  }

  function loadRecordingsFromLocalStorage() {
    const existingRecordings = JSON.parse(localStorage.getItem('recordings')) || [];
    existingRecordings.forEach(createAndAppendRecordingItem);
  }

  function createAndAppendRecordingItem(audioUrl) {
    const recordingItem = document.createElement('div');
    recordingItem.classList.add('recordedItem');
    recordingItem.innerHTML = `<audio controls src="${audioUrl}"></audio>`;
    recordingsList.appendChild(recordingItem);
  }
});
