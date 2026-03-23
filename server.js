const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Increase limit to allow photo data (Base64) to be sent to the server
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

// 1. Submit Installation (Used by Electrician)
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
        photo: photo || null, // Stores the image string
        timestamp: new Date().toISOString()
    };

    db.push(newRecord);

    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
        console.log(`✅ Record Saved: ${generatedId}`);
        res.json({ success: true, message: "Saved successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to save to file." });
    }
});

// 2. Get Data (Used by Dashboard)
app.get('/api/data', (req, res) => {
    res.json(readData());
});

// 3. Serve Dashboard Page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
