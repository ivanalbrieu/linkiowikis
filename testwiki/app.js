// app.js
const express = require('express');
const session = require('express-session');
const sequelize = require('./config/database');
const passport = require('passport');
const flash = require('connect-flash');
const app = express();
const path = require('path');
const NodeCache = require('node-cache');
const pageCountMiddleware = require('./middleware/pageCountMiddleware');

// Site configuration
const siteConfig = {
  siteName: "linkiowikis",
  wikiName: "Test Wiki",
  category: "Lifestyle"
};

// Redirect from the site root to the main wiki path
app.get('/', (req, res) => {
  res.redirect('/wiki/');
});

// Redirect from /wiki or /wiki/ specifically to /wiki/Main_Page
app.get('/wiki', (req, res) => {
    res.redirect('/wiki/Main_Page');
}); 

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'wiki'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // If you're handling JSON bodies

const Page = require('./models/Page'); // Adjust the path to your Page model

// Middleware to fetch and attach page count to all responses, excluding redirect pages
const myCache = new NodeCache();
app.locals.myCache = myCache;
app.use(pageCountMiddleware);

// Session and Passport setup

// Session setup must come before Passport's session middleware
app.use(session({
  secret: 'yourSecretKey',
  resave: false,  
  saveUninitialized: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware to make isAuthenticated globally available
app.use((req, res, next) => {
  res.locals.siteConfig = siteConfig;
  res.locals.isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : false;
  res.locals.currentUser = req.isAuthenticated() ? req.user : null;
  next();
});

require('./config/passport')(passport); // Separate Passport config

// Use connect-flash after session middleware
app.use(flash());

// Middleware to make flash messages available globally
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error'); // Passport usually uses 'error'
  next();
});

// Use routers
const loginRouter = require('./routes/login');
const accountRouter = require('./routes/account');
const pagesRouter = require('./routes/pages');
const editorRouter = require('./routes/editor');
const revisionsRouter = require('./routes/revisions');
const moveRouter = require('./routes/move');
const purgeRouter = require('./routes/purge');
const deleteRouter = require('./routes/delete');

// Use routers for specific paths first
app.use('/wiki/', loginRouter); // Handles both login and register
app.use('/wiki/', accountRouter);

// Then use the pages router
app.use('/wiki', pagesRouter);
app.use('/wiki', editorRouter);
app.use('/wiki', revisionsRouter);
app.use('/wiki', moveRouter);
app.use('/wiki', purgeRouter);
app.use('/wiki', deleteRouter);

app.get('/wiki/', (req, res) => {
  // Since this is the main page, you could set a default title like 'Main Page'
  // or any other title that makes sense for your application's context
  const defaultTitle = 'Main Page';

  res.render('index', {
    pageTitle: `${siteConfig.wikiName} | ${siteConfig.siteName}`,
    page: null,
    editMode: false,
    title: defaultTitle // Passing a title variable for use in the view
  });
});

// Other middleware and server setup...

app.get('/wiki/checkTitleExists/:title', async (req, res) => {
  const title = decodeURIComponent(req.params.title);
  try {
      const pageExists = await Page.findOne({ where: { title: title } });
      if (pageExists) {
          res.json({ exists: true });
      } else {
          res.json({ exists: false });
      }
  } catch (error) {
      console.error('Error checking if title exists:', error);
      res.status(500).json({ error: 'Error checking if title exists.' });
  }
});

//Error Handling
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Define the port variable
const port = process.env.PORT || 3000; // Use port 3000 if process.env.PORT is not defined

// Start the server
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});