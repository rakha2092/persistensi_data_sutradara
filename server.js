require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database.js');
const app = express();
const port = process.env.PORT || 3300;
app.use(cors());

// const port = 3100;

//middleware data
app.use(express.json());

app.get('/status', (req, res) => {
        res.json({
            status: 'OK',
            message: 'Server is running',
            timestamp: new Date()
        });
    }
);

//select all
app.get('/movies', (req, res) => {
    const sql = "SELECT * FROM movies ORDER BY id ASC  ";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json(rows);
    });

});

// GET semua sutradara
app.get("/directors", (req, res) => {
    db.all("SELECT * FROM directors", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

//select by id
app.get('/movies/:id', (req, res) => {
    const sql = "SELECT * FROM movies WHERE id = ?";
    const params = [req.params.id];
    db.get(sql, params, (err, row) => {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json(row);
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


//post untuk movies
app.post("/movies", (req, res) => {
    const { title, director, year } = req.body;
    const sql = "INSERT INTO movies (title, director, year) VALUES (?, ?, ?)";
    db.run(sql, [title, director, year], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, title, director, year });
    });
});

// POST untuk sutradara
app.post("/directors", (req, res) => {
    const { name, birthYear } = req.body;
    const sql = "INSERT INTO directors (name, birthYear) VALUES (?, ?)";
    db.run(sql, [name, birthYear], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, birthYear });
    });
});

// PUT update sutradara
app.put("/directors/:id", (req, res) => {
    const { id } = req.params;
    const { name, birthYear } = req.body;
    const sql = "UPDATE directors SET name = ?, birthYear = ? WHERE id = ?";
    db.run(sql, [name, birthYear, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updatedID: id });
    });
});

// PUT update movies
app.put("/movies/:id", (req, res) => {
    const { id } = req.params;
    const { title, director, year } = req.body;
    const sql = "UPDATE movies SET title = ?, director = ?, year = ? WHERE id = ?";
    db.run(sql, [title, director, year, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ updatedID: id });
    });
});

// DELETE hapus sutradara
app.delete("/directors/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM directors WHERE id = ?";
    db.run(sql, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deletedID: id });
    });
});

// delete untuk movies
app.delete("/movies/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM movies WHERE id = ?";
    db.run(sql, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deletedID: id });
    });
});

//handle 404
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

//information server listening
app.listen(port, () => {
    console.log(`Server Running on localhost:  ${port}`);
});