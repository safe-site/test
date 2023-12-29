function saveAndRedirect() {
    var websiteUrl = document.getElementById('websiteInput').value;
    if (isValidUrl(websiteUrl)) {
        // Display loading spinner
        document.getElementById('loadingSpinner').style.display = 'block';

        // Save the URL to local storage
        localStorage.setItem('savedWebsiteUrl', websiteUrl);

        // Redirect after a short delay (simulating loading)
        setTimeout(function() {
            window.location.href = websiteUrl;
        }, 1000);
    } else {
        alert('Please enter a valid URL');
    }
}

function isValidUrl(url) {
    var pattern = /^(http|https):\/\/[^ "]+$/;
    return pattern.test(url);
}

window.onload = function () {
    var savedUrl = localStorage.getItem('savedWebsiteUrl');
    if (savedUrl) {
        // Display loading spinner
        document.getElementById('loadingSpinner').style.display = 'block';

        // Redirect after a short delay (simulating loading)
        setTimeout(function() {
            window.location.href = savedUrl;
        }, 1000);
    }
};
