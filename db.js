const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./game.db');

db.serialize(() => {
  // 创建据点表
  db.run(`CREATE TABLE IF NOT EXISTS Settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    x REAL,
    y REAL,
    parent_id INTEGER,
    terrain TEXT,
    population REAL,
    economy REAL,
    finance REAL,
    military REAL,
    recruitable REAL,
    stability REAL,
    defense REAL,
    faction_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(parent_id) REFERENCES Settlements(id),
    FOREIGN KEY(faction_id) REFERENCES Factions(id)
  )`);

  // 创建阵营表
  db.run(`CREATE TABLE IF NOT EXISTS Factions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    color TEXT,
    leader_id INTEGER,
    FOREIGN KEY(leader_id) REFERENCES Settlements(id)
  )`);
});

module.exports = db;