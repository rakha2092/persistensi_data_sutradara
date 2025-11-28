require('dotenv').config();
const express = require('express');
const cors = require('cors');
// PASTIKAN FILE INI BERISI KODE PG.Pool YANG BARU
const db = require('./db.js');
const app = express();
// Menggunakan PORT dari .env atau default 3300
const port = process.env.PORT || 3300;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const { authenticateToken, authorizeRole } = require('./middleware/auth.js');

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());

// === RUTE STATUS ===
app.get('/status', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date()
    });
});

// === RUTE MOVIE (Refactored) ===

// GET all movies
app.get('/movies', authenticateToken, async (req, res, next) => {
    // JOIN antara movies dan directors untuk mendapatkan nama sutradara
    const sql = `
        SELECT m.id, m.title, m.year, d.id as director_id, d.name as director_name
        FROM movies m
        LEFT JOIN directors d ON m.director_id = d.id
        ORDER BY m.id ASC
    `;
    try {
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
}); 

// GET movie by id
app.get('/movies/:id', authenticateToken, async (req, res, next) => {
    const sql = `
        SELECT m.id, m.title, m.year, d.id as director_id, d.name as director_name
        FROM movies m
        LEFT JOIN directors d ON m.director_id = d.id
        WHERE m.id = $1
    `;
    try {
        const result = await db.query(sql, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Film tidak ditemukan" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// POST new movie
app.post('/movies', authenticateToken, async (req, res, next) => {
    // Di PostgreSQL, kolom director di movies sebaiknya menjadi director_id
    const { title, director_id, year } = req.body;
    if (!title || !director_id || !year) {
        return res.status(400).json({ error: 'title, director_id, dan year wajib diisi' });
    }
    // RETURNING * mengambil seluruh data baris yang baru dimasukkan
    const sql = 'INSERT INTO movies (title, director_id, year) VALUES ($1, $2, $3) RETURNING *';
    try {
        const result = await db.query(sql, [title, director_id, year]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// PUT update movie
app.put('/movies/:id', [authenticateToken, authorizeRole('admin')], async (req, res, next) => {
    const { title, director_id, year } = req.body;
    const sql = "UPDATE movies SET title = $1, director_id = $2, year = $3 WHERE id = $4 RETURNING *";
    try {
        const result = await db.query(sql, [title, director_id, year, req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Film tidak ditemukan" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// DELETE movie
app.delete('/movies/:id', [authenticateToken, authorizeRole('admin')], async (req, res, next) => {
    const sql = 'DELETE FROM movies WHERE id = $1 RETURNING *';
    try {
        const result = await db.query(sql, [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Film tidak ditemukan" });
        }
        res.status(204).send(); // Status 204 (No Content) untuk DELETE berhasil
    } catch (err) {
        next(err);
    }
});

// === RUTE DIRECTORS (Refactored Tugas Praktikum) ===

app.get('/directors', async (req, res, next) => {
    const sql = "SELECT id, name, birthyear FROM directors ORDER BY id ASC";
    try {
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
});

app.get('/directors/:id', async (req, res, next) => {
    const sql = "SELECT id, name, birthyear FROM directors WHERE id = $1";
    try {
        const result = await db.query(sql, [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Director not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

app.post('/directors', authenticateToken, async (req, res, next) => {
    const { name, birthYear } = req.body;
    if (!name) {
        return res.status(400).json({ error: "Name is required" });
    }
    const sql = "INSERT INTO directors (name, birthyear) VALUES ($1, $2) RETURNING *";
    try {
        const result = await db.query(sql, [name, birthYear || null]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

app.put('/directors/:id', authenticateToken, async (req, res, next) => {
    const { name, birthYear } = req.body;
    if (!name) {
        return res.status(400).json({ error: "Name is required" });
    }
    const sql = "UPDATE directors SET name = $1, birthyear = $2 WHERE id = $3 RETURNING *";
    try {
        const result = await db.query(sql, [name, birthYear || null, req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Director not found" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

app.delete('/directors/:id', authenticateToken, async (req, res, next) => {
    const sql = "DELETE FROM directors WHERE id = $1 RETURNING *";
    try {
        const result = await db.query(sql, [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Director not found" });
        }
        res.json({ deletedID: req.params.id });
    } catch (err) {
        next(err);
    }
});

// === AUTH ROUTES (Refactored) ===

app.get('/profile', authenticateToken, async (req, res, next) => {
    const sql = "SELECT id, username, role FROM users WHERE id = $1;";
    try {
        // Menggunakan id pengguna dari token untuk mendapatkan data profil
        const result = await db.query(sql, [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Pengguna tidak ditemukan" });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
});

// POST register
app.post('/auth/register', async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
        return res.status(400).json({ error: 'username dan password (min 6 char) harus diisi' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Menggunakan $1, $2, $3 untuk placeholder dan RETURNING *
        const sql = "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role";
        const params = [username.toLowerCase(), hashedPassword, 'user'];
        const result = await db.query(sql, params);

        res.status(201).json({
            message: "Registrasi berhasil",
            userID: result.rows[0].id,
            username: result.rows[0].username
        });
    } catch (err) {
        // Error code '23505' adalah kode PostgreSQL untuk UNIQUE violation
        if (err.code === '23505') {
            return res.status(409).json({ error: "Username sudah digunakan" });
        }
        next(err); // Lanjutkan ke error handler global
    }
});

app.post('/auth/register-admin', async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password || password.length < 6) {
        return res.status(400).json({ error: 'Username atau password minimal 6 karakter' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role";
        const params = [username.toLowerCase(), hashedPassword, 'admin'];
        const result = await db.query(sql, params);

        res.status(201).json({
            message: "Registrasi admin berhasil",
            userID: result.rows[0].id,
            username: result.rows[0].username
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: "Username admin sudah ada" });
        }
        next(err);
    }
});

// POST login
app.post('/auth/login', async (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'username and password harus diisi' });
    }

    try {
        const sql = "SELECT * FROM users WHERE username = $1";
        const result = await db.query(sql, [username.toLowerCase()]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: "Kredensial tidak valid" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Kredensial Tidak Valid" });
        }

        const payload = {
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: "Login berhasil", token: token });

    } catch (err) {
        next(err);
    }
});

// === ERROR HANDLING & LISTENING ===

// handle 404 (Route not found)
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('*** Global Server Error ***', err.stack);
    res.status(500).json({ error: 'Terjadi kesalahan pada server', details: err.message });
});

// information server listening
app.listen(port, '0.0.0.0', () => {
    console.log(`Server Running on localhost: ${port}`);
});