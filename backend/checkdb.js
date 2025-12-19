const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'alzheimer_care.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
  
  // Check all tables
  const tables = ['users', 'patients', 'cognitive_tests', 'vitals', 'articles', 'posts', 'questions'];
  
  tables.forEach(table => {
    console.log(`\n--- Checking ${table} table ---`);
    
    // Check if table exists
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`, (err, row) => {
      if (err) {
        console.error(`Error checking ${table} table:`, err.message);
        return;
      }
      
      if (row) {
        console.log(`✅ ${table} table exists`);
        
        // Count rows in table
        db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
          if (err) {
            console.error(`Error counting rows in ${table}:`, err.message);
            return;
          }
          console.log(`📊 Rows in ${table}: ${row.count}`);
          
          // If there are rows, show some data
          if (row.count > 0) {
            db.all(`SELECT * FROM ${table} LIMIT 3`, (err, rows) => {
              if (err) {
                console.error(`Error fetching data from ${table}:`, err.message);
                return;
              }
              console.log('💡 Sample data:', rows);
            });
          }
        });
      } else {
        console.error(`❌ ${table} table does not exist`);
      }
    });
  });
  
  // Close the database connection after some time to allow all queries to complete
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        return;
      }
      console.log('\nDatabase connection closed.');
    });
  }, 2000);
});
