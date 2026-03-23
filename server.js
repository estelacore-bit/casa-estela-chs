const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Allow large JSON payloads for Base64 photo strings
app.use(express.json({ limit: '10mb' })); 
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'installations.json');

// Helper: Read Data Safely
const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error("Error reading JSON file:", err);
        return [];
    }
};

// --- ROUTES ---

// 1. Submit Installation
app.post('/api/install', (req, res) => {
    const { generatedId, wing, floor, type, side, unitNo, oldStatus, photo } = req.body;

    if (!generatedId) {
        return res.status(400).json({ success: false, message: "Missing ID" });
    }

    const db = readData();

    // Prevent Duplicates
    if (db.some(item => item.generatedId === generatedId)) {
        return res.status(400).json({ success: false, message: "This light is already registered!" });
    }

    const newRecord = {
        generatedId,
        wing,
        floor,
        type,
        side,
        unitNo,
        oldStatus,
        photo: photo || null,
        timestamp: new Date().toISOString()
    };

    db.push(newRecord);

    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
        res.json({ success: true, message: "Saved successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to save data." });
    }
});

// 2. Get All Data
app.get('/api/data', (req, res) => {
    res.json(readData());
});

// 3. Serve Dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
