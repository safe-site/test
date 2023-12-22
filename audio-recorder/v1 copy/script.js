document.addEventListener('DOMContentLoaded', () => {
    let mediaRecorder;
    let audioChunks = [];
    let recordingsList = document.getElementById('recordingsList');
    const toggleRecordingButton = document.getElementById('toggleRecording');
    const audioElement = document.querySelector('audio');
  
    let isRecording = false;
  
    // Load existing recordings from local storage
    loadRecordingsFromLocalStorage();
  
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
  
    async function startRecording() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
  
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
  
        // Generate a unique identifier for the recording
        const recordingId = new Date().toISOString();
  
        // Save the recording URL to local storage with a unique identifier
        saveRecordingToLocalStorage(recordingId, audioUrl);
  
        // Create a new recording item
        const recordingItem = document.createElement('div');
        recordingItem.classList.add('recordedItem');
        recordingItem.innerHTML = `
          <audio controls src="${audioUrl}"></audio>
        `;
  
        // Append the recording item to the list
        recordingsList.appendChild(recordingItem);
  
        audioChunks = []; // Clear the chunks for the next recording
      };
  
      mediaRecorder.start();
    }
  
    function stopRecording() {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    }
  
    function saveRecordingToLocalStorage(recordingId, audioUrl) {
      const existingRecordings = JSON.parse(localStorage.getItem('recordings')) || {};
      existingRecordings[recordingId] = audioUrl;
      localStorage.setItem('recordings', JSON.stringify(existingRecordings));
    }
  
    function loadRecordingsFromLocalStorage() {
      const existingRecordings = JSON.parse(localStorage.getItem('recordings')) || {};
      for (const [recordingId, audioUrl] of Object.entries(existingRecordings)) {
        const recordingItem = document.createElement('div');
        recordingItem.classList.add('recordedItem');
        recordingItem.innerHTML = `
          <audio controls src="${audioUrl}"></audio>
        `;
        recordingsList.appendChild(recordingItem);
      }
    }
  });
  