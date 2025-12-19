const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all emergency contacts for a patient
router.get('/:patientId/contacts', (req, res) => {
  const { patientId } = req.params;
  
  const sql = 'SELECT * FROM emergency_contacts WHERE patient_id = ? ORDER BY is_primary DESC, name';
  
  db.all(sql, [patientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ contacts: rows });
  });
});

// Get primary emergency contact for a patient
router.get('/:patientId/contacts/primary', (req, res) => {
  const { patientId } = req.params;
  
  const sql = 'SELECT * FROM emergency_contacts WHERE patient_id = ? AND is_primary = 1 LIMIT 1';
  
  db.get(sql, [patientId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Primary contact not found' });
    res.json({ contact: row });
  });
});

// Create new emergency contact
router.post('/:patientId/contacts', (req, res) => {
  const { patientId } = req.params;
  const { name, phone, relationship, is_primary, notes } = req.body;
  
  // If this contact is marked as primary, unset all others
  if (is_primary) {
    const unsetPrimarySql = 'UPDATE emergency_contacts SET is_primary = 0 WHERE patient_id = ?';
    
    db.run(unsetPrimarySql, [patientId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Now create the new contact
      createEmergencyContact();
    });
  } else {
    createEmergencyContact();
  }
  
  function createEmergencyContact() {
    const sql = `INSERT INTO emergency_contacts (patient_id, name, phone, relationship, is_primary, notes) 
                VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [patientId, name, phone, relationship, is_primary || 0, notes], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Emergency contact created', id: this.lastID });
    });
  }
});

// Update emergency contact
router.put('/contacts/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, relationship, is_primary, notes } = req.body;
  
  // First get the patient_id to update other contacts if needed
  const getContactSql = 'SELECT patient_id FROM emergency_contacts WHERE id = ?';
  
  db.get(getContactSql, [id], (err, contact) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    
    const patientId = contact.patient_id;
    
    // If this contact is being marked as primary, unset all others
    if (is_primary) {
      const unsetPrimarySql = 'UPDATE emergency_contacts SET is_primary = 0 WHERE patient_id = ? AND id != ?';
      
      db.run(unsetPrimarySql, [patientId, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Now update the contact
        updateEmergencyContact();
      });
    } else {
      updateEmergencyContact();
    }
  });
  
  function updateEmergencyContact() {
    const sql = `UPDATE emergency_contacts SET name=?, phone=?, relationship=?, is_primary=?, notes=? 
                WHERE id=?`;
    
    db.run(sql, [name, phone, relationship, is_primary || 0, notes, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Emergency contact updated', changes: this.changes });
    });
  }
});

// Delete emergency contact
router.delete('/contacts/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM emergency_contacts WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Emergency contact deleted', changes: this.changes });
  });
});

// Set primary contact
router.put('/contacts/:id/primary', (req, res) => {
  const { id } = req.params;
  
  // First get the patient_id
  const getContactSql = 'SELECT patient_id FROM emergency_contacts WHERE id = ?';
  
  db.get(getContactSql, [id], (err, contact) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    
    const patientId = contact.patient_id;
    
    // Transaction to ensure data consistency
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Unset all primary contacts for this patient
      db.run('UPDATE emergency_contacts SET is_primary = 0 WHERE patient_id = ?', [patientId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        // Set this contact as primary
        db.run('UPDATE emergency_contacts SET is_primary = 1 WHERE id = ?', [id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          
          db.run('COMMIT');
          res.json({ message: 'Primary contact updated successfully' });
        });
      });
    });
  });
});

// Get contact for emergency call (returns phone number for easy access)
router.get('/:patientId/emergency-call', (req, res) => {
  const { patientId } = req.params;
  
  // First try to get primary contact
  const sql = 'SELECT * FROM emergency_contacts WHERE patient_id = ? ORDER BY is_primary DESC LIMIT 1';
  
  db.get(sql, [patientId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'No emergency contacts found' });
    
    // For emergency call, we return the contact details including phone
    res.json({ 
      contact: row,
      call_info: { 
        phone_number: row.phone,
        contact_name: row.name
      }
    });
  });
});

module.exports = router;