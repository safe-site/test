document.addEventListener('DOMContentLoaded', () => {
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
  
    const recordingButton = document.getElementById('recordingButton');
    const audioPlayer = document.getElementById('audioPlayer');
    const audioListContainer = document.getElementById('audioList');
  
    recordingButton.addEventListener('click', () => {
      if (!isRecording) {
        startRecording();
      } else {
        stopRecording();
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
            audioPlayer.src = audioUrl;
  
            // Save audio data to local storage
            const audioData = localStorage.getItem('audioData') || '[]';
            const parsedAudioData = JSON.parse(audioData);
            parsedAudioData.push(audioUrl);
            localStorage.setItem('audioData', JSON.stringify(parsedAudioData));
  
            // Display audio list
            displayAudioList(parsedAudioData);
          };
  
          mediaRecorder.start();
          isRecording = true;
          updateButtonAppearance();
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error);
        });
    }
  
    function stopRecording() {
      if (mediaRecorder) {
        mediaRecorder.stop();
        isRecording = false;
        updateButtonAppearance();
      }
    }
  
    function updateButtonAppearance() {
      recordingButton.classList.toggle('recording', isRecording);
      recordingButton.innerText = isRecording ? '\u23F8;' : '\u25B6;';
    }
  
    // Display audio list on page load
    const initialAudioData = localStorage.getItem('audioData') || '[]';
    const parsedInitialAudioData = JSON.parse(initialAudioData);
    displayAudioList(parsedInitialAudioData);
  
    function displayAudioList(audioData) {
      audioListContainer.innerHTML = '';
  
      audioData.forEach((audioUrl, index) => {
        const audioElement = document.createElement('audio');
        audioElement.src = audioUrl;
        audioElement.controls = true;
  
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', () => {
          audioData.splice(index, 1);
          localStorage.setItem('audioData', JSON.stringify(audioData));
          displayAudioList(audioData);
        });
  
        const listItem = document.createElement('div');
        listItem.appendChild(audioElement);
        listItem.appendChild(deleteButton);
  
        audioListContainer.appendChild(listItem);
      });
    }
  });
  