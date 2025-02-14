const socket = io();

document.getElementById('scanButton').addEventListener('click', async () => {
    const url = document.getElementById('urlInput').value;
    if (!url) return;

    document.getElementById('scanningAnimation').classList.remove('hidden');
    document.getElementById('scanningAnimation2').classList.remove('hidden');
    document.getElementById('progressBar').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');

    try {
        const response = await fetch('/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        displayResults(data.brokenLinks);
    } catch (error) {
        console.error('Error scanning the website:', error);
        alert('Error scanning the website: ' + error.message);
    } finally {
        document.getElementById('scanningAnimation').classList.add('hidden');
        document.getElementById('scanningAnimation2').classList.add('hidden');
        document.getElementById('progressBar').classList.add('hidden');
    }
});

socket.on('progress', (data) => {
    document.getElementById('progress').style.width = `${data.progress}%`;
});

function displayResults(brokenLinks) {
    const results = document.getElementById('results');
    const brokenLinksList = document.getElementById('brokenLinks');
    brokenLinksList.innerHTML = '';

    if (brokenLinks && brokenLinks.length > 0) {
        brokenLinks.forEach(link => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>URL:</strong> ${link.url}<br>
                <strong>Status Code:</strong> ${link.statusCode}<br>
                <strong>Response Time:</strong> ${link.responseTime ? `${link.responseTime} ms` : 'N/A'}
            `;
            brokenLinksList.appendChild(li);
        });
        results.classList.remove('hidden');
    } else {
        results.innerHTML = '<p>No broken links found!</p>';
        results.classList.remove('hidden');
    }
}
