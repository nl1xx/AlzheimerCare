const express = require('express');
const router = express.Router();
const db = require('../database');

// Create/Update Patient Profile
router.post('/profile', (req, res) => {
  const { userId, name, age, diagnosis_status, condition_stage } = req.body;
  
  // Check if profile exists for user
  db.get('SELECT id FROM patients WHERE user_id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row) {
      // Update
      const sql = `UPDATE patients SET name=?, age=?, diagnosis_status=?, condition_stage=? WHERE user_id=?`;
      db.run(sql, [name, age, diagnosis_status, condition_stage, userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Profile updated', patientId: row.id });
      });
    } else {
      // Create
      const sql = `INSERT INTO patients (user_id, name, age, diagnosis_status, condition_stage) VALUES (?, ?, ?, ?, ?)`;
      db.run(sql, [userId, name, age, diagnosis_status, condition_stage], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Profile created', patientId: this.lastID });
      });
    }
  });
});

// Get Profile
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  db.get('SELECT * FROM patients WHERE user_id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ patient: row });
  });
});

module.exports = router;
