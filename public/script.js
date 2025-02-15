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
        displayResults(data.brokenLinks, data.seoRecommendations);
    } catch (error) {
        console.error('Error scanning the website:', error);
        alert('Error scanning the website: ' + error.message);
    } finally {
        document.getElementById('scanningAnimation').classList.add('hidden');
        document.getElementById('scanningAnimation2').classList.add('hidden');
        document.getElementById('progressBar').classList.add('hidden');
    }
});

document.getElementById('exportCsvButton').addEventListener('click', () => {
    window.location.href = '/export/csv';
});

document.getElementById('exportJsonButton').addEventListener('click', () => {
    window.location.href = '/export/json';
});

socket.on('progress', (data) => {
    document.getElementById('progress').style.width = `${data.progress}%`;
});

function displayResults(brokenLinks, seoRecommendations) {
    const results = document.getElementById('results');
    const brokenLinksList = document.getElementById('brokenLinks');
    const seoRecommendationsList = document.getElementById('seoRecommendations');
    brokenLinksList.innerHTML = '';
    seoRecommendationsList.innerHTML = '';

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
    } else {
        brokenLinksList.innerHTML = '<p>No broken links found!</p>';
    }

    if (seoRecommendations && seoRecommendations.length > 0) {
        seoRecommendations.forEach(recommendation => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${recommendation.type}:</strong> ${recommendation.description}<br>
                ${recommendation.details.length > 0 ? `<strong>Details:</strong> ${recommendation.details.map(detail => detail.text).join(', ')}` : ''}
            `;
            seoRecommendationsList.appendChild(li);
        });
    } else {
        seoRecommendationsList.innerHTML = '<p>No SEO recommendations available.</p>';
    }

    results.classList.remove('hidden');
}
