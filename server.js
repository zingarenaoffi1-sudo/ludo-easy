const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets and web application files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        app: 'Ludo',
        modes: ['vs_computer', 'pass_and_play'],
        timestamp: new Date().toISOString()
    });
});

// Fallback to index.html for root or SPA navigation
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎲 Ludo Server running on port ${PORT}`);
});
