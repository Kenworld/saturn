const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const app = express();
const port = 3000;
const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.use(express.json());

let scanResults = [];

app.post('/scan', async (req, res) => {
    const { url } = req.body;
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const links = [];

        $('a').each((index, element) => {
            const href = $(element).attr('href');
            if (href) {
                links.push(href);
            }
        });

        scanResults = await checkLinks(links, url, io);
        res.json({ brokenLinks: scanResults });
    } catch (error) {
        console.error('Error scanning the website:', error);
        res.status(500).json({ error: 'Error scanning the website' });
    }
});

app.get('/export/csv', (req, res) => {
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(scanResults);
    res.header('Content-Type', 'text/csv');
    res.attachment('scan_results.csv');
    return res.send(csv);
});

app.get('/export/json', (req, res) => {
    res.header('Content-Type', 'application/json');
    res.attachment('scan_results.json');
    return res.send(JSON.stringify(scanResults, null, 2));
});

async function checkLinks(links, baseUrl, io) {
    const brokenLinks = [];
    const totalLinks = links.length;
    let checkedLinks = 0;

    for (const link of links) {
        const fullUrl = new URL(link, baseUrl).href;
        let statusCode = null;
        let responseTime = null;

        try {
            const startTime = Date.now();
            const response = await axios.get(fullUrl);
            responseTime = Date.now() - startTime;
            statusCode = response.status;
        } catch (error) {
            if (error.response) {
                statusCode = error.response.status;
            } else {
                statusCode = 'Error';
            }
            brokenLinks.push({ url: fullUrl, statusCode, responseTime });
        }

        checkedLinks++;
        const progress = (checkedLinks / totalLinks) * 100;
        io.emit('progress', { progress });
    }
    return brokenLinks;
}

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
