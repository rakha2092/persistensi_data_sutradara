require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

const dbsource = process.env.DB_SOURCE;
const db = new sqlite3.Database(dbsource, (err) => {
    if (err) {
        console.error("Error", err.message);
    } else {
        console.log(`Connected to database : ${dbsource}`);

        db.serialize(() => {
            // Tabel movies
            db.run(`
                CREATE TABLE IF NOT EXISTS movies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    director TEXT NOT NULL,
                    year TEXT
                );
            `);

            // Tabel directors
            db.run(`
                CREATE TABLE IF NOT EXISTS directors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    birthYear TEXT
                );
            `);

            // Insert contoh data
            const insertMovies = "INSERT INTO movies (title, director, year) VALUES (?,?,?)";
            db.run(insertMovies, ["Naruto", "Rakha", "2006"]);
            db.run(insertMovies, ["Boboiboy", "Rizqi", "2000"]);
            db.run(insertMovies, ["Spongebob", "Salam", "2009"]);   
            console.log("Movies inserted");

            const insertDirectors = "INSERT INTO directors (name, birthYear) VALUES (?,?)";
            db.run(insertDirectors, ["Rakha", "2006"]);
            db.run(insertDirectors, ["Rizqi", "2000"]);
            db.run(insertDirectors, ["Salam", "2009"]);
            console.log("Directors inserted");
        });
    }
});

module.exports = db;
