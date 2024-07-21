const express = require('express');
const ejs = require('ejs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // To store sessions in MongoDB
const users = require('./models/mongo.js');
const quotesCollection = require('./models/quotes.js');

const app = express();
const port = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/quotesapp', { useNewUrlParser: true, useUnifiedTopology: true });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(express.json());

app.use(session({
    secret: 'Thor2024@cc',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/quotesapp' }),
    cookie: { secure: false }
}));

// Middleware to check if the user is logged in
const sessionChecker = (req, res, next) => {
    if (req.session.user) {
        res.redirect('/dashboard');
    } else {
        next();
    }
};

// Routes
const auth = require('./routes/auth');
const quotesRouter = require('./routes/quotes');
app.use('/auth', auth);
app.use('/quotes', quotesRouter);

app.get('/', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:3000/quotes'); // Fetch quotes using the quotes router
        const quotes = response.data;

        if (req.session.user) {
            res.redirect('/dashboard');
        } else {
            res.render('index', { quotes });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/signUp', sessionChecker, (req, res) => {
    res.render('auth/signUp', {message: " "});
});

app.get('/signIn', sessionChecker, (req, res) => {
    res.render('auth/signIn');
});

app.get('/cancel', async (req, res) => {
    const response = await axios.get('http://localhost:3000/quotes'); // Fetch quotes using the quotes router
    const quotes = response.data;
    res.render('allquote', { user: req.session.user, quotes });
});

app.get('/update', (req, res) => {
    res.render('updateContent');
});

app.get('/dashboard', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:3000/quotes'); // Fetch quotes using the quotes router
        const quotes = response.data;

        if (req.session.user) {
            res.render('dashboard', { user: req.session.user, quotes });
        } else {
            res.redirect('/');
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/addquote', (req, res) => {
    res.render('addQuote');
});

app.get('/home', (req, res) => {
    res.render('home');
});

app.get('/allquote', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:3000/quotes'); // Fetch quotes using the quotes router
        const quotes = response.data;

        if (req.session.user) {
            res.render('allquote', { user: req.session.user, quotes });
        } else {
            res.redirect('/signIn');
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/authors', async (req, res) => {
    try {
        const authors = await quotesCollection.distinct('author');
        authors.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())); // Ensure case-insensitive sorting
        res.render('authors', { authors });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/authors/:letter', async (req, res) => {
    try {
      const letter = req.params.letter.toUpperCase();
      const authors = await quotesCollection
        .aggregate([
          { $match: { author: { $regex: `^${letter}`, $options: 'i' } } },
          { $group: { _id: '$author' } },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, author: '$_id' } }
        ]);
  
      const authorNames = authors.map(authorDoc => authorDoc.author);
      res.json(authorNames);
    } catch (err) {
      console.error('Error fetching authors:', err);
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/myquote', (req, res)=>{
    const userId = req.session.user.id;
    // console.log(userId);
    res.render('myquotes', {_id: userId});
  })

app.listen(port, () => {
    console.log(`Listening to http://localhost:${port}`);
});
