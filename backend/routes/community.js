const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Get Articles (Knowledge Base)
router.get('/articles', (req, res) => {
  const { category } = req.query;
  let sql = 'SELECT * FROM articles';
  const params = [];
  if (category) {
    sql += ' WHERE category = ?';
    params.push(category);
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ articles: rows });
  });
});

// Get Community Posts
router.get('/posts', (req, res) => {
  const sql = `
    SELECT posts.*, users.phone as author 
    FROM posts 
    LEFT JOIN users ON posts.user_id = users.id 
    ORDER BY created_at DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ posts: rows });
  });
});

// Create Post (Protected)
router.post('/posts', authenticateToken, (req, res) => {
  const { title, content, category } = req.body;
  const userId = req.user.id;
  
  const sql = 'INSERT INTO posts (user_id, title, content, category) VALUES (?, ?, ?, ?)';
  db.run(sql, [userId, title, content, category], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Post created', id: this.lastID });
  });
});

// Update Post (Protected)
router.put('/posts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, content, category } = req.body;
  const userId = req.user.id;
  
  // Check if user is the author
  const checkSql = 'SELECT * FROM posts WHERE id = ? AND user_id = ?';
  db.get(checkSql, [id, userId], (err, post) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!post) return res.status(403).json({ error: 'Unauthorized to update this post' });
    
    const sql = 'UPDATE posts SET title=?, content=?, category=? WHERE id=?';
    db.run(sql, [title, content, category, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Post updated', changes: this.changes });
    });
  });
});

// Delete Post (Protected)
router.delete('/posts/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Check if user is the author
  const checkSql = 'SELECT * FROM posts WHERE id = ? AND user_id = ?';
  db.get(checkSql, [id, userId], (err, post) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!post) return res.status(403).json({ error: 'Unauthorized to delete this post' });
    
    // Delete related comments and likes first
    db.serialize(() => {
      db.run('DELETE FROM comments WHERE post_id = ?', [id]);
      db.run('DELETE FROM likes WHERE post_id = ?', [id]);
      db.run('DELETE FROM posts WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Post deleted', changes: this.changes });
      });
    });
  });
});

// ---------------------- Comments ----------------------

// Get comments for a post
router.get('/posts/:postId/comments', (req, res) => {
  const { postId } = req.params;
  
  const sql = `
    SELECT comments.*, users.phone as author 
    FROM comments 
    LEFT JOIN users ON comments.user_id = users.id 
    WHERE comments.post_id = ? 
    ORDER BY comments.created_at ASC
  `;
  
  db.all(sql, [postId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ comments: rows });
  });
});

// Create comment (Protected)
router.post('/posts/:postId/comments', authenticateToken, (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;
  
  const sql = 'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)';
  db.run(sql, [postId, userId, content], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Comment created', id: this.lastID });
  });
});

// Update comment (Protected)
router.put('/comments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;
  
  // Check if user is the author
  const checkSql = 'SELECT * FROM comments WHERE id = ? AND user_id = ?';
  db.get(checkSql, [id, userId], (err, comment) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!comment) return res.status(403).json({ error: 'Unauthorized to update this comment' });
    
    const sql = 'UPDATE comments SET content=? WHERE id=?';
    db.run(sql, [content, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Comment updated', changes: this.changes });
    });
  });
});

// Delete comment (Protected)
router.delete('/comments/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Check if user is the author
  const checkSql = 'SELECT * FROM comments WHERE id = ? AND user_id = ?';
  db.get(checkSql, [id, userId], (err, comment) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!comment) return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    
    const sql = 'DELETE FROM comments WHERE id = ?';
    db.run(sql, [id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Comment deleted', changes: this.changes });
    });
  });
});

// ---------------------- Likes ----------------------

// Get likes for a post
router.get('/posts/:postId/likes', (req, res) => {
  const { postId } = req.params;
  
  const sql = `
    SELECT likes.*, users.phone as user_phone 
    FROM likes 
    LEFT JOIN users ON likes.user_id = users.id 
    WHERE likes.post_id = ?
  `;
  
  db.all(sql, [postId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ likes: rows, count: rows.length });
  });
});

// Check if user liked a post
router.get('/posts/:postId/likes/check', authenticateToken, (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  
  const sql = 'SELECT * FROM likes WHERE post_id = ? AND user_id = ?';
  db.get(sql, [postId, userId], (err, like) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ is_liked: !!like });
  });
});

// Like a post (Protected)
router.post('/posts/:postId/likes', authenticateToken, (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  
  // Check if already liked
  const checkSql = 'SELECT * FROM likes WHERE post_id = ? AND user_id = ?';
  db.get(checkSql, [postId, userId], (err, like) => {
    if (err) return res.status(500).json({ error: err.message });
    if (like) return res.status(400).json({ error: 'Post already liked' });
    
    const sql = 'INSERT INTO likes (post_id, user_id) VALUES (?, ?)';
    db.run(sql, [postId, userId], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Post liked', id: this.lastID });
    });
  });
});

// Unlike a post (Protected)
router.delete('/posts/:postId/likes', authenticateToken, (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;
  
  const sql = 'DELETE FROM likes WHERE post_id = ? AND user_id = ?';
  db.run(sql, [postId, userId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Like not found' });
    res.json({ message: 'Post unliked' });
  });
});

// ---------------------- Categories ----------------------

// Get all post categories
router.get('/categories', (req, res) => {
  const sql = 'SELECT DISTINCT category FROM posts WHERE category IS NOT NULL AND category != ""';
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const categories = rows.map(row => row.category);
    res.json({ categories });
  });
});

// ---------------------- Expert Q&A ----------------------

// Get expert questions
router.get('/expert/questions', (req, res) => {
  const { answered } = req.query;
  let sql = `
    SELECT expert_questions.*, users.phone as user_phone 
    FROM expert_questions 
    LEFT JOIN users ON expert_questions.user_id = users.id 
    ORDER BY expert_questions.created_at DESC
  `;
  
  if (answered) {
    sql = `
      SELECT expert_questions.*, users.phone as user_phone, expert_answers.answer 
      FROM expert_questions 
      LEFT JOIN users ON expert_questions.user_id = users.id 
      LEFT JOIN expert_answers ON expert_questions.id = expert_answers.question_id 
      WHERE expert_answers.answer IS NOT NULL 
      ORDER BY expert_questions.created_at DESC
    `;
  }
  
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ questions: rows });
  });
});

// Create expert question (Protected)
router.post('/expert/questions', authenticateToken, (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;
  
  const sql = 'INSERT INTO expert_questions (user_id, title, content) VALUES (?, ?, ?)';
  db.run(sql, [userId, title, content], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Question submitted to experts', id: this.lastID });
  });
});

// Get expert answer for a question
router.get('/expert/questions/:questionId/answer', (req, res) => {
  const { questionId } = req.params;
  
  const sql = `
    SELECT expert_answers.* 
    FROM expert_answers 
    WHERE expert_answers.question_id = ?
  `;
  
  db.get(sql, [questionId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ answer: row });
  });
});

module.exports = router;
