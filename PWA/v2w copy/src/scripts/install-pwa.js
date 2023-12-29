
// Show the install button if the app is installable
if (deferredPrompt) {
    document.getElementById('installButton').style.display = 'block';
  
    // Handle the install button click
    document.getElementById('installButton').addEventListener('click', () => {
      // Show the install prompt
      deferredPrompt.prompt();
  
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
  
        // Reset the deferredPrompt for the next time it's triggered
        deferredPrompt = null;
      });
    });
  }
  