require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleware/authMiddleware');

const app = express();
const port = process.env.PORT || 3300;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());



// ROUTE STATUS
app.get('/status', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date() });
});

// AUTH ROUTES
app.post('/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'username dan password (min 6 char) harus diisi' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ error: 'gagal memproses pendaftaran' });

    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.run(sql, [username.toLowerCase(), hashedPassword], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(409).json({ error: 'username sudah digunakan' });
        }
        return res.status(500).json({ error: 'gagal menyimpan pengguna' });
      }
      res.status(201).json({ message: 'registrasi berhasil', userId: this.lastID });
    });
  });
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username dan password harus diisi' });

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.get(sql, [username.toLowerCase()], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'kredensial tidak valid' });

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) return res.status(401).json({ error: 'kredensial tidak valid' });

      const payload = { user: { id: user.id, username: user.username } };
      jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
        if (err) return res.status(500).json({ error: 'gagal membuat token' });
        res.json({ message: 'login berhasil', token });
      });
    });
  });
});

// MOVIES ROUTES (protected)
app.get('/movies', (req, res) => {
  db.all('SELECT * FROM movies ORDER BY id ASC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/movies', authenticateToken, (req, res) => {
    console.log("body diterima:", req.body);
    const { title, director, year } = req.body;
    db.run('INSERT INTO movies (title, director, year) VALUES (?, ?, ?)', [title, director, year], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, director, year });
  });
});

// POST untuk sutradara
app.post("/directors", authenticateToken,(req, res) => {
    const { name, birthYear } = req.body;
    const sql = "INSERT INTO directors (name, birthYear) VALUES (?, ?)";
    db.run(sql, [name, birthYear], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, birthYear });
    });
});

// GET semua sutradara
app.get("/directors", (req, res) => {
    db.all("SELECT * FROM directors", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.put('/movies/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, director, year } = req.body;
  db.run('UPDATE movies SET title=?, director=?, year=? WHERE id=?', [title, director, year, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updatedID: id });
  });
});

// PUT update sutradara
app.put("/directors/:id", authenticateToken,(req, res) => {
    const { id } = req.params;
    const { name, birthYear } = req.body;
    const sql = "UPDATE directors SET name = ?, birthYear = ? WHERE id = ?";
    db.run(sql, [name, birthYear, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updatedID: id });
    });
});

// GET sutradara by ID
app.get("/directors/:id", (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM directors WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: "Not found" });
        res.json(row);
    });
});

app.delete('/movies/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM movies WHERE id=?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deletedID: id });
  });
});

// // DELETE hapus sutradara
app.delete("/directors/:id", authenticateToken,(req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM directors WHERE id = ?";
    db.run(sql, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deletedID: id });
    });
});

// fallback 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// START SERVER
app.listen(port, () => console.log(`Server berjalan di port ${port}`));
