const express = require('express');
const router = express.Router();
const db = require('../database');

// --- Cognitive Tests ---

// Save Test Result
router.post('/cognitive', (req, res) => {
  const { patientId, test_type = 'memory', score, level, details } = req.body;
  const sql = 'INSERT INTO cognitive_tests (patient_id, test_type, score, level, details) VALUES (?, ?, ?, ?, ?)';
  db.run(sql, [patientId, test_type, score, level, JSON.stringify(details)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Test saved', id: this.lastID });
  });
});

// Get Test History
router.get('/cognitive/:patientId', (req, res) => {
  const { patientId } = req.params;
  const { test_type } = req.query; // optional filter by test type
  let sql = 'SELECT * FROM cognitive_tests WHERE patient_id = ?';
  const params = [patientId];
  
  if (test_type) {
    sql += ' AND test_type = ?';
    params.push(test_type);
  }
  
  sql += ' ORDER BY date DESC';
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ history: rows });
  });
});

// --- Vital Signs ---

// Save Vital Sign
router.post('/vitals', (req, res) => {
  const { patientId, type, value, unit } = req.body;
  const sql = 'INSERT INTO vitals (patient_id, type, value, unit) VALUES (?, ?, ?, ?)';
  db.run(sql, [patientId, type, value, unit], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Vital sign recorded', id: this.lastID });
  });
});

// Get Vitals History
router.get('/vitals/:patientId', (req, res) => {
  const { patientId } = req.params;
  const { type } = req.query; // optional filter
  let sql = 'SELECT * FROM vitals WHERE patient_id = ?';
  const params = [patientId];
  
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY date DESC LIMIT 50';
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ history: rows });
  });
});

// Get Questions
router.get('/questions', (req, res) => {
  const sql = 'SELECT * FROM questions';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse JSON options
    const questions = rows.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));
    res.json({ questions });
  });
});

module.exports = router;
