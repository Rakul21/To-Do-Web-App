const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Server } = require('socket.io');
const http = require('http');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use(limiter);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// User Schema
const userSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  displayName: String,
});
const User = mongoose.model('User', userSchema);

// Task Schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  status: { type: String, enum: ['In Progress', 'Completed'], default: 'In Progress' },
  dueDate: Date,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sharedWith: [{ type: String }], // Emails of users
  createdAt: { type: Date, default: Date.now },
});
const Task = mongoose.model('Task', taskSchema);

// Passport Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      displayName: profile.displayName,
    }).save();
  }
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  !!!
});

// Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const token = jwt.sign({ id: req.user._id, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.redirect(`http://localhost:3000?token=${token}`);
});

// Get user profile
app.get('/api/user', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
});

// CRUD Operations
app.get('/api/tasks', verifyToken, async (req, res) => {
  const { page = 1, limit = 10, sort = 'createdAt', status, priority } = req.query;
  const query = { $or: [{ userId: req.user.id }, { sharedWith: req.user.email }] };
  if (status) query.status = status;
  if (priority) query.priority = priority;
  const tasks = await Task.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json(tasks);
});

app.post('/api/tasks', verifyToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('priority').isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
  body('status').isIn(['In Progress', 'Completed']).withMessage('Invalid status'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const task = new Task({ ...req.body, userId: req.user.id });
  await task.save();
  io.emit('taskUpdate', task);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', verifyToken, [
  body('title').notEmpty().withMessage('Title is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const task = await Task.findById(req.params.id);
  if (!task || (task.userId.toString() !== req.user.id && !task.sharedWith.includes(req.user.email))) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  Object.assign(task, req.body);
  await task.save();
  io.emit('taskUpdate', task);
  res.json(task);
});

app.delete('/api/tasks/:id', verifyToken, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task || (task.userId.toString() !== req.user.id && !task.sharedWith.includes(req.user.email))) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  await task.deleteOne();
  io.emit('taskUpdate', { _id: req.params.id, deleted: true });
  res.json({ message: 'Task deleted' });
});

// Share task
app.post('/api/tasks/:id/share', verifyToken, [
  body('email').isEmail().withMessage('Invalid email'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const task = await Task.findById(req.params.id);
  if (!task || task.userId.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  task.sharedWith.push(req.body.email);
  await task.save();
  io.emit('taskUpdate', task);
  res.json(task);
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));