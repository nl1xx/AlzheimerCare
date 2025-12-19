const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Helper function to format date ranges
function getDateRangeQuery(startDate, endDate, dateField = 'date') {
  let query = '';
  const params = [];
  
  if (startDate && endDate) {
    query = ` AND ${dateField} BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  } else if (startDate) {
    query = ` AND ${dateField} >= ?`;
    params.push(startDate);
  } else if (endDate) {
    query = ` AND ${dateField} <= ?`;
    params.push(endDate);
  }
  
  return { query, params };
}

// Helper function to convert JSON to CSV
function jsonToCsv(data, fields) {
  const header = fields.join(',');
  const rows = data.map(row => {
    return fields.map(field => {
      const value = row[field];
      // Handle commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
}

// ---------------------- Export All Patient Data ----------------------

// Export all patient data in JSON format
router.get('/:patientId/all', authenticateToken, (req, res) => {
  const { patientId } = req.params;
  const { start_date, end_date } = req.query;
  
  // Get all relevant data for the patient
  const promises = [];
  
  // Cognitive tests
  const { query: testQuery, params: testParams } = getDateRangeQuery(start_date, end_date, 'date');
  promises.push(new Promise((resolve, reject) => {
    const sql = `SELECT * FROM cognitive_tests WHERE patient_id = ?${testQuery} ORDER BY date DESC`;
    db.all(sql, [patientId, ...testParams], (err, rows) => {
      if (err) reject(err);
      else resolve({ cognitive_tests: rows });
    });
  }));
  
  // Vitals
  const { query: vitalsQuery, params: vitalsParams } = getDateRangeQuery(start_date, end_date);
  promises.push(new Promise((resolve, reject) => {
    const sql = `SELECT * FROM vitals WHERE patient_id = ?${vitalsQuery} ORDER BY date DESC`;
    db.all(sql, [patientId, ...vitalsParams], (err, rows) => {
      if (err) reject(err);
      else resolve({ vitals: rows });
    });
  }));
  
  // Medications
  promises.push(new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM medications WHERE patient_id = ?';
    db.all(sql, [patientId], (err, rows) => {
      if (err) reject(err);
      else {
        const medications = rows.map(med => ({ ...med, times: JSON.parse(med.times) }));
        resolve({ medications });
      }
    });
  }));
  
  // Medication reminders
  const { query: reminderQuery, params: reminderParams } = getDateRangeQuery(start_date, end_date, 'reminder_date');
  promises.push(new Promise((resolve, reject) => {
    const sql = `SELECT * FROM medication_reminders WHERE medication_id IN (SELECT id FROM medications WHERE patient_id = ?)${reminderQuery} ORDER BY reminder_date DESC`;
    db.all(sql, [patientId, ...reminderParams], (err, rows) => {
      if (err) reject(err);
      else resolve({ medication_reminders: rows });
    });
  }));
  
  // Activities
  const { query: activityQuery, params: activityParams } = getDateRangeQuery(start_date, end_date);
  promises.push(new Promise((resolve, reject) => {
    const sql = `SELECT * FROM activities WHERE patient_id = ?${activityQuery} ORDER BY date DESC`;
    db.all(sql, [patientId, ...activityParams], (err, rows) => {
      if (err) reject(err);
      else resolve({ activities: rows });
    });
  }));
  
  // Sleep records
  const { query: sleepQuery, params: sleepParams } = getDateRangeQuery(start_date, end_date, 'start_time');
  promises.push(new Promise((resolve, reject) => {
    const sql = `SELECT * FROM sleep_records WHERE patient_id = ?${sleepQuery} ORDER BY start_time DESC`;
    db.all(sql, [patientId, ...sleepParams], (err, rows) => {
      if (err) reject(err);
      else resolve({ sleep_records: rows });
    });
  }));
  
  // Diet records
  const { query: dietQuery, params: dietParams } = getDateRangeQuery(start_date, end_date, 'created_at');
  promises.push(new Promise((resolve, reject) => {
    const sql = `SELECT * FROM diet_records WHERE patient_id = ?${dietQuery} ORDER BY created_at DESC`;
    db.all(sql, [patientId, ...dietParams], (err, rows) => {
      if (err) reject(err);
      else {
        const dietRecords = rows.map(record => ({ ...record, food_items: JSON.parse(record.food_items) }));
        resolve({ diet_records: dietRecords });
      }
    });
  }));
  
  // Emergency contacts
  promises.push(new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM emergency_contacts WHERE patient_id = ? ORDER BY is_primary DESC';
    db.all(sql, [patientId], (err, rows) => {
      if (err) reject(err);
      else resolve({ emergency_contacts: rows });
    });
  }));
  
  // Resolve all promises and return combined data
  Promise.all(promises)
    .then(results => {
      const exportData = { patient_id: patientId, export_date: new Date().toISOString() };
      results.forEach(result => {
        Object.assign(exportData, result);
      });
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_all_data.json`);
      res.json(exportData);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// ---------------------- Export Cognitive Tests ----------------------

// Export cognitive tests in JSON format
router.get('/:patientId/cognitive-tests', authenticateToken, (req, res) => {
  const { patientId } = req.params;
  const { start_date, end_date, format = 'json' } = req.query;
  
  const { query, params } = getDateRangeQuery(start_date, end_date, 'date');
  const sql = `SELECT * FROM cognitive_tests WHERE patient_id = ?${query} ORDER BY date DESC`;
  
  db.all(sql, [patientId, ...params], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (format === 'csv') {
      const fields = ['id', 'patient_id', 'test_type', 'date', 'score', 'level', 'details', 'created_at'];
      const csvData = jsonToCsv(rows, fields);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_cognitive_tests.csv`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_cognitive_tests.json`);
      res.json({ cognitive_tests: rows });
    }
  });
});

// ---------------------- Export Vitals ----------------------

// Export vitals in JSON or CSV format
router.get('/:patientId/vitals', authenticateToken, (req, res) => {
  const { patientId } = req.params;
  const { start_date, end_date, format = 'json' } = req.query;
  
  const { query, params } = getDateRangeQuery(start_date, end_date);
  const sql = `SELECT * FROM vitals WHERE patient_id = ?${query} ORDER BY date DESC`;
  
  db.all(sql, [patientId, ...params], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (format === 'csv') {
      const fields = ['id', 'patient_id', 'type', 'value', 'unit', 'date', 'created_at'];
      const csvData = jsonToCsv(rows, fields);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_vitals.csv`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_vitals.json`);
      res.json({ vitals: rows });
    }
  });
});

// ---------------------- Export Medications ----------------------

// Export medications in JSON or CSV format
router.get('/:patientId/medications', authenticateToken, (req, res) => {
  const { patientId } = req.params;
  const { format = 'json' } = req.query;
  
  const sql = 'SELECT * FROM medications WHERE patient_id = ?';
  
  db.all(sql, [patientId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const medications = rows.map(med => ({ ...med, times: JSON.parse(med.times) }));
    
    if (format === 'csv') {
      const fields = ['id', 'patient_id', 'name', 'dosage', 'frequency', 'times', 'start_date', 'end_date', 'notes'];
      // For CSV, convert times array to string
      const csvRows = medications.map(med => ({
        ...med,
        times: JSON.stringify(med.times)
      }));
      const csvData = jsonToCsv(csvRows, fields);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_medications.csv`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_medications.json`);
      res.json({ medications });
    }
  });
});

// ---------------------- Export Activity Records ----------------------

// Export activities in JSON or CSV format
router.get('/:patientId/activities', authenticateToken, (req, res) => {
  const { patientId } = req.params;
  const { start_date, end_date, format = 'json' } = req.query;
  
  const { query, params } = getDateRangeQuery(start_date, end_date);
  const sql = `SELECT * FROM activities WHERE patient_id = ?${query} ORDER BY date DESC`;
  
  db.all(sql, [patientId, ...params], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (format === 'csv') {
      const fields = ['id', 'patient_id', 'type', 'name', 'duration', 'date', 'notes', 'created_at'];
      const csvData = jsonToCsv(rows, fields);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_activities.csv`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_activities.json`);
      res.json({ activities: rows });
    }
  });
});

// ---------------------- Export Sleep Records ----------------------

// Export sleep records in JSON or CSV format
router.get('/:patientId/sleep', authenticateToken, (req, res) => {
  const { patientId } = req.params;
  const { start_date, end_date, format = 'json' } = req.query;
  
  // For sleep records, we need to query based on start_time
  const { query, params } = getDateRangeQuery(start_date, end_date, 'start_time');
  const sql = `SELECT * FROM sleep_records WHERE patient_id = ?${query} ORDER BY start_time DESC`;
  
  db.all(sql, [patientId, ...params], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (format === 'csv') {
      const fields = ['id', 'patient_id', 'start_time', 'end_time', 'duration', 'quality', 'notes'];
      const csvData = jsonToCsv(rows, fields);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_sleep_records.csv`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_sleep_records.json`);
      res.json({ sleep_records: rows });
    }
  });
});

// ---------------------- Export Diet Records ----------------------

// Export diet records in JSON or CSV format
router.get('/:patientId/diet', authenticateToken, (req, res) => {
  const { patientId } = req.params;
  const { start_date, end_date, format = 'json' } = req.query;
  
  const { query, params } = getDateRangeQuery(start_date, end_date, 'created_at');
  const sql = `SELECT * FROM diet_records WHERE patient_id = ?${query} ORDER BY created_at DESC`;
  
  db.all(sql, [patientId, ...params], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const dietRecords = rows.map(record => ({ ...record, food_items: JSON.parse(record.food_items) }));
    
    if (format === 'csv') {
      const fields = ['id', 'patient_id', 'meal_type', 'food_items', 'calories', 'notes', 'created_at'];
      // For CSV, convert food_items array to string
      const csvRows = dietRecords.map(record => ({
        ...record,
        food_items: JSON.stringify(record.food_items)
      }));
      const csvData = jsonToCsv(csvRows, fields);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_diet_records.csv`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_diet_records.json`);
      res.json({ diet_records: dietRecords });
    }
  });
});

// ---------------------- Export Medication Reminders ----------------------

// Export medication reminders in JSON or CSV format
router.get('/:patientId/medication-reminders', authenticateToken, (req, res) => {
  const { patientId } = req.params;
  const { start_date, end_date, format = 'json' } = req.query;
  
  const { query, params } = getDateRangeQuery(start_date, end_date, 'reminder_date');
  const sql = `
    SELECT mr.*, m.name, m.dosage 
    FROM medication_reminders mr 
    JOIN medications m ON mr.medication_id = m.id 
    WHERE m.patient_id = ?${query} 
    ORDER BY mr.reminder_date DESC, mr.time
  `;
  
  db.all(sql, [patientId, ...params], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (format === 'csv') {
      const fields = ['id', 'medication_id', 'name', 'dosage', 'time', 'reminder_date', 'is_taken', 'taken_at', 'created_at'];
      const csvData = jsonToCsv(rows, fields);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_medication_reminders.csv`);
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=patient_${patientId}_medication_reminders.json`);
      res.json({ medication_reminders: rows });
    }
  });
});

module.exports = router;