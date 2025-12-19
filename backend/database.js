const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'alzheimer_care.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Users table (Caregivers)
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Patients table (Care Recipients)
    db.run(`CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      age INTEGER,
      condition_stage TEXT, -- 'normal', 'mild', 'moderate', 'severe'
      diagnosis_status TEXT, -- 'yes', 'no', 'uncertain'
      avatar TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Cognitive Test Results
    db.run(`CREATE TABLE IF NOT EXISTS cognitive_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      test_type TEXT, -- 'memory', 'attention', 'language', 'orientation', 'executive'
      score INTEGER,
      level TEXT, -- 'normal', 'mild_decline', 'significant_decline'
      details TEXT, -- JSON string of answers if needed
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )`);

    // Vitals Records
    db.run(`CREATE TABLE IF NOT EXISTS vitals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      type TEXT, -- 'heart_rate', 'breath', 'sleep'
      value REAL,
      unit TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )`);

    // Articles (Knowledge Base)
    db.run(`CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      category TEXT, -- 'cognitive', 'care', 'behavior', 'psychology'
      read_time INTEGER,
      is_expert_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Community Posts
    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      content TEXT,
      category TEXT,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Cognitive Questions Bank
    db.run(`CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT,
      type TEXT, -- 'choice', 'image_choice', 'scenario'
      options TEXT, -- JSON string
      correct_answer TEXT,
      difficulty INTEGER DEFAULT 1
    )`);

    // Medications
    db.run(`CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      name TEXT,
      dosage TEXT,
      frequency TEXT,
      times TEXT, -- JSON string of times (e.g., ["08:00", "12:00", "18:00"])
      start_date DATE,
      end_date DATE,
      notes TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )`);

    // Medication Reminders
    db.run(`CREATE TABLE IF NOT EXISTS medication_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medication_id INTEGER,
      time TEXT,
      is_taken INTEGER DEFAULT 0,
      taken_at DATETIME,
      reminder_date DATE,
      FOREIGN KEY (medication_id) REFERENCES medications(id)
    )`);

    // Activities
    db.run(`CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      type TEXT, -- 'physical', 'cognitive', 'social', 'daily_living'
      name TEXT,
      duration INTEGER, -- minutes
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )`);

    // Sleep Records
    db.run(`CREATE TABLE IF NOT EXISTS sleep_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      start_time DATETIME,
      end_time DATETIME,
      duration INTEGER, -- minutes
      quality TEXT, -- 'good', 'fair', 'poor'
      notes TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )`);

    // Diet Records
    db.run(`CREATE TABLE IF NOT EXISTS diet_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      meal_type TEXT, -- 'breakfast', 'lunch', 'dinner', 'snack'
      food_items TEXT, -- JSON string
      calories INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )`);

    // Emergency Contacts
    db.run(`CREATE TABLE IF NOT EXISTS emergency_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      name TEXT,
      phone TEXT,
      relationship TEXT,
      is_primary INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    )`);

    // Post Comments
    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Post Likes
    db.run(`CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(post_id, user_id)
    )`);
    
    // Seed Data Check
    db.get("SELECT count(*) as count FROM articles", (err, row) => {
      if (row && row.count === 0) {
        const stmt = db.prepare("INSERT INTO articles (title, content, category, read_time, is_expert_verified) VALUES (?, ?, ?, ?, ?)");
        stmt.run("阿尔茨海默病早期十大症状", "1. 记忆力减退... 2. 计划或解决问题困难...", "cognitive", 5, 1);
        stmt.run("照护者如何缓解焦虑？", "照护者往往承受着巨大的心理压力...", "psychology", 8, 1);
        stmt.run("如何应对老人的情绪波动？", "了解情绪背后的原因，学会共情与转移注意力...", "behavior", 6, 1);
        stmt.finalize();
        console.log("Seeded initial articles.");
      }
    });

    // Seed Questions Check
    db.get("SELECT count(*) as count FROM questions", (err, row) => {
      if (row && row.count === 0) {
        const stmt = db.prepare("INSERT INTO questions (question, type, options, correct_answer) VALUES (?, ?, ?, ?)");
        stmt.run("今天是星期几？", "choice", JSON.stringify(['星期一', '星期二', '星期三', '记不清了']), "actual_day");
        stmt.run("下面哪张图片是“杯子”？", "image_choice", JSON.stringify(['🍎', '🚗', '☕', '🐶']), "2");
        stmt.run("如果家里有人敲门，他应该怎么做？", "scenario", JSON.stringify(['直接开门', '先问是谁', '不理会']), "1");
        stmt.finalize();
        console.log("Seeded initial questions.");
      }
    });
  });
}

module.exports = db;
