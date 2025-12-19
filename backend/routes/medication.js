const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all medications for a patient
router.get('/:patientId', (req, res) => {
  const { patientId } = req.params;
  const sql = 'SELECT * FROM medications WHERE patient_id = ?';
  db.all(sql, [patientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse times JSON
    const medications = rows.map(med => ({
      ...med,
      times: JSON.parse(med.times)
    }));
    res.json({ medications });
  });
});

// Create new medication
router.post('/', (req, res) => {
  const { patient_id, name, dosage, frequency, times, start_date, end_date, notes } = req.body;
  
  const sql = `INSERT INTO medications (patient_id, name, dosage, frequency, times, start_date, end_date, notes) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [patient_id, name, dosage, frequency, JSON.stringify(times), start_date, end_date, notes], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // Create reminders for each time
    times.forEach(time => {
      const reminderSql = `INSERT INTO medication_reminders (medication_id, time, reminder_date) 
                          VALUES (?, ?, ?)`;
      db.run(reminderSql, [this.lastID, time, start_date]);
    });
    
    res.json({ message: 'Medication created', id: this.lastID });
  });
});

// Update medication
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, dosage, frequency, times, start_date, end_date, notes } = req.body;
  
  const sql = `UPDATE medications SET name=?, dosage=?, frequency=?, times=?, start_date=?, end_date=?, notes=? 
              WHERE id=?`;
  
  db.run(sql, [name, dosage, frequency, JSON.stringify(times), start_date, end_date, notes, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Medication updated', changes: this.changes });
  });
});

// Delete medication
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Delete reminders first
  db.run('DELETE FROM medication_reminders WHERE medication_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Delete medication
    db.run('DELETE FROM medications WHERE id = ?', [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Medication deleted', changes: this.changes });
    });
  });
});

// Get medication reminders for a patient
router.get('/:patientId/reminders', (req, res) => {
  const { patientId } = req.params;
  const { date } = req.query;
  
  let sql = `SELECT mr.*, m.name, m.dosage 
             FROM medication_reminders mr 
             JOIN medications m ON mr.medication_id = m.id 
             WHERE m.patient_id = ?`;
  
  const params = [patientId];
  
  if (date) {
    sql += ' AND reminder_date = ?';
    params.push(date);
  }
  
  sql += ' ORDER BY time';
  
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ reminders: rows });
  });
});

// Mark reminder as taken
router.put('/reminders/:id/take', (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();
  
  const sql = `UPDATE medication_reminders SET is_taken = 1, taken_at = ? WHERE id = ?`;
  
  db.run(sql, [now, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Reminder marked as taken', changes: this.changes });
  });
});

module.exports = router;