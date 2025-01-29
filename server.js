const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// 获取当前游戏状态
app.get('/api/game-state', (req, res) => {
  const query = `
    SELECT s.*, f.name AS faction_name, f.color AS faction_color
    FROM Settlements s
    LEFT JOIN Factions f ON s.faction_id = f.id
    ORDER BY s.timestamp DESC
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 创建新据点
app.post('/api/settlements', (req, res) => {
  const { name, x, y, ...rest } = req.body;
  
  // 添加坐标验证
  if (isNaN(parseFloat(x)) || isNaN(parseFloat(y))) {
      return res.status(400).json({ error: 'Invalid coordinates' });
  }

  const query = `
      INSERT INTO Settlements 
      (name, x, y, terrain, population, economy, finance, military, recruitable, stability, defense, faction_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
      name,
      parseFloat(x),  // 确保转换为浮点数
      parseFloat(y),  // 确保转换为浮点数
      rest.terrain,
      rest.population,
      rest.economy,
      rest.finance,
      rest.military,
      rest.recruitable,
      rest.stability,
      rest.defense,
      rest.faction_id
  ];
  
  db.run(query, params, function(err) {
      if (err) {
          return res.status(400).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
  });
});

// 推进时间线
app.post('/api/advance-year', (req, res) => {
  // 获取最新状态
  db.all('SELECT * FROM Settlements ORDER BY timestamp DESC', (err, settlements) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // 插入新状态
    const insertQuery = `
      INSERT INTO Settlements 
      (name, x, y, parent_id, terrain, population, economy, finance, military, recruitable, stability, defense, faction_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    settlements.forEach(settlement => {
      const newPopulation = settlement.population * (0.95 + Math.random() * 0.1);
      const newEconomy = settlement.economy * (0.9 + Math.random() * 0.2);
      // 其他属性的随机变化...

      const params = [
        settlement.name,
        settlement.x,
        settlement.y,
        settlement.parent_id,
        settlement.terrain,
        newPopulation,
        newEconomy,
        settlement.finance,
        settlement.military,
        settlement.recruitable,
        settlement.stability,
        settlement.defense,
        settlement.faction_id
      ];

      db.run(insertQuery, params);
    });

    res.sendStatus(201);
  });
});

// 更新据点信息
app.put('/api/settlements/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const setClause = Object.keys(updates)
    .map(key => `${key} = ?`)
    .join(', ');
    
  const values = Object.values(updates);
  values.push(id);
  
  const query = `UPDATE Settlements SET ${setClause} WHERE id = ?`;
  
  db.run(query, values, function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ changes: this.changes });
  });
});

// 阵营管理
app.post('/api/factions', (req, res) => {
  const { name, color, leader_id } = req.body;
  
  const query = `
    INSERT INTO Factions (name, color, leader_id)
    VALUES (?, ?, ?)
  `;
  
  db.run(query, [name, color, leader_id], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// 在server.js中添加获取所有阵营的接口
app.get('/api/factions', (req, res) => {
    db.all('SELECT * FROM Factions', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// 获取所有据点用于上级选择（可选）
app.get('/api/all-settlements', (req, res) => {
    db.all('SELECT id, name FROM Settlements', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// const PORT = 3090;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const port = process.env.PORT || 3090;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`You can now open your browser and visit:
    http://localhost:${port}`);
    
    // 添加自动打开浏览器的功能（可选）
    // const { exec } = require('child_process');
    // const start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
    // exec(`${start} http://localhost:${port}`);
});