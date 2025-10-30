const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

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

function validatePassword(password) {
  const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
  return regex.test(password);
}


app.post('/register', async (req, res) => {
  const { login, email, password } = req.body;

  if (!login || !email || !password) {
    return res.status(400).json({
      error: 'All fields are required'
    });
  }

  if (login.length < 5 || login.length > 20) {
    return res.status(400).json({
      error: 'Login must be between 5 and 20 characters'
    });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format'
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


app.get('/films', async (req, res) => {
  const db = await readDB();
  res.json(db.films);
});

app.get('/films/:imdbId', async (req, res) => {
  const db = await readDB();
  const film = db.films.find(f => f.imdbId === req.params.imdbId);

  if (!film) {
    return res.status(404).json({ error: 'Film not found' });
  }

  res.json(film);
});

app.post('/films', async (req, res) => {
  const { imdbId, title, year, poster, plot, director, actors, genre, runtime, imdbRating } = req.body;

  if (!imdbId || !title) {
    return res.status(400).json({ error: 'imdbId and title are required' });
  }

  const db = await readDB();

  const existingFilm = db.films.find(f => f.imdbId === imdbId);
  if (existingFilm) {
    return res.json(existingFilm);
  }

  const newFilm = {
    imdbId,
    title,
    year: year || '',
    poster: poster || '',
    plot: plot || '',
    director: director || '',
    actors: actors || '',
    genre: genre || '',
    runtime: runtime || '',
    imdbRating: imdbRating || '',
    createdAt: new Date().toISOString()
  };

  db.films.push(newFilm);

  if (!await writeDB(db)) {
    return res.status(500).json({ error: 'Failed to save film' });
  }

  res.status(201).json(newFilm);
});


// GET /reviews - Get all reviews
app.get('/reviews', async (req, res) => {
  const db = await readDB();
  res.json(db.reviews);
});

// GET /reviews/film/:imdbId - Get reviews for a specific film
app.get('/reviews/film/:imdbId', async (req, res) => {
  const db = await readDB();
  const filmReviews = db.reviews.filter(r => r.imdbId === req.params.imdbId);
  res.json(filmReviews);
});

// POST /reviews - Create new review
app.post('/reviews', async (req, res) => {
  const { userId, imdbId, rating, reviewText } = req.body;

  if (!userId || !imdbId) {
    return res.status(400).json({ error: 'userId and imdbId are required' });
  }

  const db = await readDB();

  // Check if user exists
  const user = db.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const newReview = {
    id: Date.now().toString(),
    userId,
    imdbId,
    rating: rating || 0,
    reviewText: reviewText || '',
    createdAt: new Date().toISOString()
  };

  db.reviews.push(newReview);

  if (!await writeDB(db)) {
    return res.status(500).json({ error: 'Failed to save review' });
  }

  res.status(201).json(newReview);
});


// GET /comments - Get all comments
app.get('/comments', async (req, res) => {
  const db = await readDB();
  res.json(db.comments || []);
});

// GET /comments/film/:imdbId - Get comments for a specific film
app.get('/comments/film/:imdbId', async (req, res) => {
  const db = await readDB();
  const filmComments = (db.comments || []).filter(c => c.imdbId === req.params.imdbId);
  res.json(filmComments);
});

// POST /comments - Create new comment
app.post('/comments', async (req, res) => {
  const { userId, imdbId, commentText, parentCommentId } = req.body;

  if (!userId || !imdbId || !commentText) {
    return res.status(400).json({ error: 'userId, imdbId, and commentText are required' });
  }

  const db = await readDB();

  // Check if user exists
  const user = db.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!db.comments) {
    db.comments = [];
  }

  const newComment = {
    id: Date.now().toString(),
    userId,
    imdbId,
    commentText,
    parentCommentId: parentCommentId || null,
    createdAt: new Date().toISOString()
  };

  db.comments.push(newComment);

  if (!await writeDB(db)) {
    return res.status(500).json({ error: 'Failed to save comment' });
  }

  res.status(201).json(newComment);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

