const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');
const OMDB_API_URL = 'http://www.omdbapi.com/';
const OMDB_API_KEY = '584a9ebe';

app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: true
}));
app.use(express.json());

async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], films: [], reviews: [], comments: [] };
  }
}

async function writeDB(data) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
}

function generateToken(userId) {
  return Buffer.from(`${userId}-${Date.now()}`).toString('base64');
}

app.post('/register', async (req, res) => {

  const { login, email, password } = req.body;

  if (!login || !email || !password) {
    return res.status(400).json({
      error: 'All fields are required'
    });
  }

  const db = await readDB();

  const existingUser = db.users.find(u => u.email === email || u.login === login);
  if (existingUser) {
    return res.status(409).json({
      error: 'User with this email or login already exists'
    });
  }

  const newUser = {
    id: Date.now().toString(),
    login,
    email,
    password,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  if (!await writeDB(db)) {
    return res.status(500).json({
      error: 'Failed to save user'
    });
  }

  const token = generateToken(newUser.id);

  const { password: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    accessToken: token,
    user: userWithoutPassword
  });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required'
    });
  }

  const db = await readDB();
  const user = db.users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({
      error: 'Invalid email or password'
    });
  }

  const token = generateToken(user.id);
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    accessToken: token,
    user: userWithoutPassword
  });
});

app.get('/users', async (req, res) => {
  const db = await readDB();
  const usersWithoutPasswords = db.users.map(({ password, ...user }) => user);
  res.json(usersWithoutPasswords);
});


app.get('/users/:id', async (req, res) => {
  const db = await readDB();
  const user = db.users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.get('/movies/search', async (req, res) => {
  const { title } = req.query;

  if (!title) {
    return res.status(400).json({ error: 'Title parameter is required' });
  }

  try {
    const response = await axios.get(`${OMDB_API_URL}?s=${title}&apikey=${OMDB_API_KEY}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching from OMDB:', error.message);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

app.get('/movies/details/:imdbId', async (req, res) => {
  const { imdbId } = req.params;

  try {
    const response = await axios.get(`${OMDB_API_URL}?i=${imdbId}&apikey=${OMDB_API_KEY}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching movie details from OMDB:', error.message);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// Reviews endpoints
app.get('/reviews', async (req, res) => {
  const { imdbId, userId } = req.query;
  const db = await readDB();
  
  let reviews = db.reviews || [];
  
  if (imdbId) {
    reviews = reviews.filter(r => r.imdbId === imdbId);
  }
  
  if (userId) {
    reviews = reviews.filter(r => r.userId === userId);
  }
  
  res.json(reviews);
});

app.post('/reviews', async (req, res) => {
  const { userId, imdbId, rating, createdAt } = req.body;

  if (!userId || !imdbId || rating === undefined) {
    return res.status(400).json({
      error: 'userId, imdbId, and rating are required'
    });
  }

  if (rating < 0 || rating > 5) {
    return res.status(400).json({
      error: 'Rating must be between 0 and 5'
    });
  }

  const db = await readDB();
  
  if (!db.reviews) {
    db.reviews = [];
  }

  // Check if user already has a review for this movie
  const existingReview = db.reviews.find(r => r.userId === userId && r.imdbId === imdbId);
  if (existingReview) {
    return res.status(409).json({
      error: 'User already has a review for this movie. Use PATCH to update.'
    });
  }

  const newReview = {
    id: Date.now().toString(),
    userId,
    imdbId,
    rating,
    createdAt: createdAt || new Date().toISOString()
  };

  db.reviews.push(newReview);

  if (!await writeDB(db)) {
    return res.status(500).json({
      error: 'Failed to save review'
    });
  }

  res.status(201).json(newReview);
});

app.patch('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;

  if (rating === undefined) {
    return res.status(400).json({
      error: 'Rating is required'
    });
  }

  if (rating < 0 || rating > 5) {
    return res.status(400).json({
      error: 'Rating must be between 0 and 5'
    });
  }

  const db = await readDB();
  
  if (!db.reviews) {
    db.reviews = [];
  }

  const reviewIndex = db.reviews.findIndex(r => r.id === id);

  if (reviewIndex === -1) {
    return res.status(404).json({
      error: 'Review not found'
    });
  }

  db.reviews[reviewIndex].rating = rating;
  db.reviews[reviewIndex].createdAt = new Date().toISOString();

  if (!await writeDB(db)) {
    return res.status(500).json({
      error: 'Failed to update review'
    });
  }

  res.json(db.reviews[reviewIndex]);
});

app.delete('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  
  if (!db.reviews) {
    db.reviews = [];
  }

  const reviewIndex = db.reviews.findIndex(r => r.id === id);

  if (reviewIndex === -1) {
    return res.status(404).json({
      error: 'Review not found'
    });
  }

  db.reviews.splice(reviewIndex, 1);

  if (!await writeDB(db)) {
    return res.status(500).json({
      error: 'Failed to delete review'
    });
  }

  res.status(204).send();
});

// Comments endpoints
app.get('/comments', async (req, res) => {
  const { imdbId } = req.query;
  const db = await readDB();
  
  let comments = db.comments || [];
  
  if (imdbId) {
    comments = comments.filter(c => c.imdbId === imdbId);
  }
  
  res.json(comments);
});

app.post('/comments', async (req, res) => {
  const { userId, imdbId, commentText, createdAt } = req.body;

  if (!userId || !imdbId || !commentText) {
    return res.status(400).json({
      error: 'userId, imdbId, and commentText are required'
    });
  }

  const db = await readDB();
  
  if (!db.comments) {
    db.comments = [];
  }

  const newComment = {
    id: Date.now().toString(),
    userId,
    imdbId,
    commentText,
    createdAt: createdAt || new Date().toISOString()
  };

  db.comments.push(newComment);

  if (!await writeDB(db)) {
    return res.status(500).json({
      error: 'Failed to save comment'
    });
  }

  res.status(201).json(newComment);
});

app.delete('/comments/:id', async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  
  if (!db.comments) {
    db.comments = [];
  }

  const commentIndex = db.comments.findIndex(c => c.id === id);

  if (commentIndex === -1) {
    return res.status(404).json({
      error: 'Comment not found'
    });
  }

  db.comments.splice(commentIndex, 1);

  if (!await writeDB(db)) {
    return res.status(500).json({
      error: 'Failed to delete comment'
    });
  }

  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

