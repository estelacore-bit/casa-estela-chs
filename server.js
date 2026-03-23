const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' })); 
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'installations.json');

const readData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) return [];
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (err) {
        return [];
    }
};

app.post('/api/install', (req, res) => {
    const db = readData();
    const newRecord = { ...req.body, timestamp: new Date().toISOString() };
    if (db.some(item => item.generatedId === newRecord.generatedId)) {
        return res.status(400).json({ success: false, message: "This Light ID already exists." });
    }
    db.push(newRecord);
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    res.json({ success: true });
});

app.get('/api/data', (req, res) => {
    res.json(readData());
});

// Route for the new Report/Analytics page
app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html'));
});

app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
