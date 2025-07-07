const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'company_management'
});

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', ws => {
    ws.on('message', message => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });
});

app.post('/signup', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
        res.status(200).json({ message: 'Signup successful' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Username already exists' });
        } else {
            res.status(500).json({ error: 'Server error' });
        }
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.status(200).json({ user: { id: user.id, username: user.username, role: user.role } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/holiday', async (req, res) => {
    const { user_id, date, reason } = req.body;
    try {
        await db.query('INSERT INTO holiday_requests (user_id, date, reason) VALUES (?, ?, ?)', [user_id, date, reason]);
        res.status(200).json({ message: 'Holiday request submitted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/holiday', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT hr.id, hr.user_id, hr.date, hr.reason, hr.status, u.username 
            FROM holiday_requests hr 
            JOIN users u ON hr.user_id = u.id
        `);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/holiday/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query('UPDATE holiday_requests SET status = ? WHERE id = ?', [status, id]);
        res.status(200).json({ message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/users', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, username, role FROM users');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/message', async (req, res) => {
    const { sender_id, recipient_id, message } = req.body;
    try {
        await db.query('INSERT INTO private_messages (sender_id, recipient_id, message) VALUES (?, ?, ?)', 
            [sender_id, recipient_id, message]);
        res.status(200).json({ message: 'Message sent' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/messages/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT pm.id, pm.message, pm.timestamp, 
                   u1.username AS sender_username, 
                   u2.username AS recipient_username
            FROM private_messages pm
            JOIN users u1 ON pm.sender_id = u1.id
            JOIN users u2 ON pm.recipient_id = u2.id
            WHERE pm.sender_id = ? OR pm.recipient_id = ?
        `, [userId, userId]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});