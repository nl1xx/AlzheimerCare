const express = require('express');
const router = express.Router();
const db = require('../database');

// ---------------------- Daily Activities ----------------------

// Get all activities for a patient
router.get('/:patientId/activities', (req, res) => {
  const { patientId } = req.params;
  const { start_date, end_date } = req.query;
  
  let sql = 'SELECT * FROM activities WHERE patient_id = ?';
  const params = [patientId];
  
  if (start_date && end_date) {
    sql += ' AND date BETWEEN ? AND ?';
    params.push(start_date, end_date);
  } else if (start_date) {
    sql += ' AND date >= ?';
    params.push(start_date);
  } else if (end_date) {
    sql += ' AND date <= ?';
    params.push(end_date);
  }
  
  sql += ' ORDER BY date DESC';
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ activities: rows });
  });
});

// Create new activity
router.post('/:patientId/activities', (req, res) => {
  const { patientId } = req.params;
  const { type, name, duration, notes, date } = req.body;
  
  const sql = `INSERT INTO activities (patient_id, type, name, duration, notes, date) 
              VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [patientId, type, name, duration, notes, date], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Activity created', id: this.lastID });
  });
});

// Update activity
router.put('/activities/:id', (req, res) => {
  const { id } = req.params;
  const { type, name, duration, notes, date } = req.body;
  
  const sql = `UPDATE activities SET type=?, name=?, duration=?, notes=?, date=? 
              WHERE id=?`;
  
  db.run(sql, [type, name, duration, notes, date, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Activity updated', changes: this.changes });
  });
});

// Delete activity
router.delete('/activities/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM activities WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Activity deleted', changes: this.changes });
  });
});

// ---------------------- Sleep Records ----------------------

// Get all sleep records for a patient
router.get('/:patientId/sleep', (req, res) => {
  const { patientId } = req.params;
  const { start_date, end_date } = req.query;
  
  let sql = 'SELECT * FROM sleep_records WHERE patient_id = ?';
  const params = [patientId];
  
  if (start_date && end_date) {
    sql += ' AND start_time BETWEEN ? AND ?';
    params.push(start_date, end_date);
  } else if (start_date) {
    sql += ' AND start_time >= ?';
    params.push(start_date);
  } else if (end_date) {
    sql += ' AND start_time <= ?';
    params.push(end_date);
  }
  
  sql += ' ORDER BY start_time DESC';
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ sleep_records: rows });
  });
});

// Create new sleep record
router.post('/:patientId/sleep', (req, res) => {
  const { patientId } = req.params;
  const { start_time, end_time, quality, notes } = req.body;
  
  // Calculate duration in minutes
  const start = new Date(start_time);
  const end = new Date(end_time);
  const duration = Math.round((end - start) / (1000 * 60));
  
  const sql = `INSERT INTO sleep_records (patient_id, start_time, end_time, duration, quality, notes) 
              VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [patientId, start_time, end_time, duration, quality, notes], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Sleep record created', id: this.lastID });
  });
});

// Update sleep record
router.put('/sleep/:id', (req, res) => {
  const { id } = req.params;
  const { start_time, end_time, quality, notes } = req.body;
  
  // Calculate duration in minutes
  const start = new Date(start_time);
  const end = new Date(end_time);
  const duration = Math.round((end - start) / (1000 * 60));
  
  const sql = `UPDATE sleep_records SET start_time=?, end_time=?, duration=?, quality=?, notes=? 
              WHERE id=?`;
  
  db.run(sql, [start_time, end_time, duration, quality, notes, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Sleep record updated', changes: this.changes });
  });
});

// Delete sleep record
router.delete('/sleep/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM sleep_records WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Sleep record deleted', changes: this.changes });
  });
});

// ---------------------- Diet Records ----------------------

// Get all diet records for a patient
router.get('/:patientId/diet', (req, res) => {
  const { patientId } = req.params;
  const { start_date, end_date, meal_type } = req.query;
  
  let sql = 'SELECT * FROM diet_records WHERE patient_id = ?';
  const params = [patientId];
  
  if (start_date && end_date) {
    sql += ' AND created_at BETWEEN ? AND ?';
    params.push(start_date, end_date);
  } else if (start_date) {
    sql += ' AND created_at >= ?';
    params.push(start_date);
  } else if (end_date) {
    sql += ' AND created_at <= ?';
    params.push(end_date);
  }
  
  if (meal_type) {
    sql += ' AND meal_type = ?';
    params.push(meal_type);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ diet_records: rows });
  });
});

// Create new diet record
router.post('/:patientId/diet', (req, res) => {
  const { patientId } = req.params;
  const { meal_type, food_items, calories, notes } = req.body;
  
  const sql = `INSERT INTO diet_records (patient_id, meal_type, food_items, calories, notes) 
              VALUES (?, ?, ?, ?, ?)`;
  
  db.run(sql, [patientId, meal_type, JSON.stringify(food_items), calories, notes], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Diet record created', id: this.lastID });
  });
});

// Update diet record
router.put('/diet/:id', (req, res) => {
  const { id } = req.params;
  const { meal_type, food_items, calories, notes } = req.body;
  
  const sql = `UPDATE diet_records SET meal_type=?, food_items=?, calories=?, notes=? 
              WHERE id=?`;
  
  db.run(sql, [meal_type, JSON.stringify(food_items), calories, notes, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Diet record updated', changes: this.changes });
  });
});

// Delete diet record
router.delete('/diet/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM diet_records WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Diet record deleted', changes: this.changes });
  });
});

module.exports = router;