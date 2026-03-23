const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'installations.json');

// Helper to read data
const readData = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
};

// 1. Simple Login Logic (Hardcoded for Phase 1)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Simple check - in Phase 2 this moves to a Database
    if (username === 'electrician' && password === 'estela2026') {
        res.json({ success: true, role: 'electrician' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
});

// 2. Submit Installation
app.post('/api/install', (req, res) => {
    const { wing, floor, type, side, unitNo, oldStatus } = req.body;
    
    // Construct the unique ID based on your new format
    const generatedId = `ESTELA-${wing}-${floor}-${type.charAt(0)}-${side}${unitNo}`;
    
    const db = readData();
    
    // Check if this specific light position is already recorded
    const exists = db.find(item => item.generatedId === generatedId);
    if (exists) {
        return res.status(400).json({ success: false, message: "This light is already registered!" });
    }

    const newRecord = {
        generatedId,
        wing,
        floor,
        type,
        side,
        unitNo,
        timestamp: new Date().toISOString(),
        oldLight: oldStatus // { type, workingCount, nonWorkingCount }
    };

    db.push(newRecord);
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    
    res.json({ success: true, id: generatedId });
});

// 3. Get Dashboard Summary
app.get('/api/dashboard', (req, res) => {
    const db = readData();
    // Logic to aggregate counts per wing for the manager
    res.json(db);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
