document.addEventListener('DOMContentLoaded', function () {
  let successfulMessages = 0;
  let unsuccessfulMessages = 0;
  let successfulChatIds = {};
  let unsuccessfulChatIds = {};

  const savedChatIds = localStorage.getItem('savedChatIds') || '';
  const savedCustomApiKey = localStorage.getItem('savedCustomApiKey') || '';

  const botTokens = {
      bot1: '6781718048:AAGh6KZzbSGnxjgyXmBXbl9FC38HyeLsJ04',
      bot2: '6838053773:AAEes45x0DAACSVYuoKkxL8wradaPlkgax4',
      bot3: '6480899749:AAGOpu7E0pTbR4TwqbC6UeET3t3FwCXOvBY',
      bot4: '6973252360:AAFOsNC7Wjii4A-8nNpPydDUautDzvMNOSg',
      bot5: '6978588916:AAEm1jZ7iZaWNRQWgELxH12HNs4QS7V6ock',
  };

  const chatIdsInput = document.getElementById('chatIds');
  const customBotApiKeyInput = document.getElementById('customBotApiKey');
  const smsContentInput = document.getElementById('smsContent');
  const imageInput = document.getElementById('imageInput');
  const sendButton = document.getElementById('sendButton');

  chatIdsInput.value = savedChatIds;
  customBotApiKeyInput.value = savedCustomApiKey;

  const startLoadingAnimation = () => {
      sendButton.textContent = 'Sending...';
      sendButton.disabled = true;
  };

  const stopLoadingAnimation = () => {
      sendButton.textContent = 'Send Message';
      sendButton.disabled = false;
  };

  const sendMessageToTelegram = async (botToken, chatId, message, photo, isPhotoMessage) => {
      startLoadingAnimation();

      try {
          const apiUrl = `https://api.telegram.org/bot${botToken}/${isPhotoMessage ? 'sendPhoto' : 'sendMessage'}`;

          const formData = new FormData();
          formData.append('chat_id', chatId);
          formData.append(isPhotoMessage ? 'caption' : 'text', message);

          if (isPhotoMessage && photo) {
              formData.append('photo', photo);
          }

          const response = await axios.post(apiUrl, formData, {
              headers: {
                  'Content-Type': 'multipart/form-data',
              },
          });

          if (response.data.ok) {
              successfulMessages++;
              successfulChatIds[chatId] = true;
          } else {
              unsuccessfulMessages++;
              unsuccessfulChatIds[chatId] = true;
          }
      } catch (error) {
          unsuccessfulMessages++;
          unsuccessfulChatIds[chatId] = true;
      } finally {
          stopLoadingAnimation();
          updateOverallMessageCount();
      }
  };

  const displayMessage = () => {
    const overallCountElement = document.getElementById('overallCount');
    overallCountElement.innerHTML = `Message Send: <span style="color: green;">${successfulMessages}</span>/<span style="color: red;">${unsuccessfulMessages}</span>`;
    overallCountElement.onclick = () => displayChatIds();
};


  const displayChatIds = () => {
    const modal = document.getElementById('chatIdsModal');
    const modalContent = document.getElementById('modalContent');
    
    modal.style.display = 'block';

    const successChatIds = Object.keys(successfulChatIds);
    const failureChatIds = Object.keys(unsuccessfulChatIds);

    const successTable = generateTable(successChatIds, 'Successful Chat IDs');
    const failureTable = generateTable(failureChatIds, 'Unsuccessful Chat IDs');

    modalContent.innerHTML = successTable + failureTable;
};

const generateTable = (chatIds, title) => {
    if (chatIds.length === 0) {
        return `<p>${title}: No Chat IDs</p>`;
    }

    const tableRows = chatIds.map(chatId => `<tr><td>${chatId}</td></tr>`).join('');

    return `
        <p>${title}:</p>
        <table>
            <thead>
                <tr>
                    <th>Chat ID</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
};

// Add this function to close the modal
const closeModal = () => {
    const modal = document.getElementById('chatIdsModal');
    modal.style.display = 'none';
};

// Add this event listener to close the modal when clicking outside the modal or on the close button
window.addEventListener('click', (event) => {
    const modal = document.getElementById('chatIdsModal');
    const closeButton = document.querySelector('.close');
    
    if (event.target === modal || event.target === closeButton) {
        closeModal();
    }
});




  const updateOverallMessageCount = () => {
      displayMessage();
  };

  const showHideCustomBotApiKeyField = () => {
      const botSelect = document.getElementById('botSelect');
      const customBotApiKeyContainer = document.getElementById('customBotApiKeyContainer');

      customBotApiKeyContainer.style.display = botSelect.value === 'custom' ? 'block' : 'none';
  };

  const sendMessage = async () => {
      startLoadingAnimation();

      const botSelect = document.getElementById('botSelect');
      const selectedBot = botSelect.value;
      const customBotApiKey = customBotApiKeyInput.value;
      const chatIds = chatIdsInput.value;
      const smsContent = smsContentInput.value;
      const imageFile = imageInput.files[0];

      let botToken;

      if (selectedBot === 'custom' && customBotApiKey.trim() !== '') {
          botToken = customBotApiKey.trim();
      } else {
          botToken = botTokens[selectedBot];
      }

      localStorage.setItem('savedChatIds', chatIds);
      localStorage.setItem('savedCustomApiKey', customBotApiKey);

      const cleanedChatIds = chatIds.split(',').map(id => id.trim());

      if (imageFile) {
          await Promise.all(cleanedChatIds.map(chatId => sendMessageToTelegram(botToken, chatId, smsContent, imageFile, true)));
      } else if (smsContent.trim() !== '') {
          await Promise.all(cleanedChatIds.map(chatId => sendMessageToTelegram(botToken, chatId, smsContent, null, false)));
      } else {
          unsuccessfulMessages++;
          updateOverallMessageCount();
          alert('Please enter text and/or select an image.');
      }

      stopLoadingAnimation();
  };

  sendButton.addEventListener('click', sendMessage);

  const botSelect = document.getElementById('botSelect');
  botSelect.addEventListener('change', showHideCustomBotApiKeyField);
});
