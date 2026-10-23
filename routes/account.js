const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User'); // Adjust the path as necessary

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/img/avatars/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = file.originalname.split('.').pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${fileExtension}`);
  }
});

// Initialize multer with the defined storage configuration
const upload = multer({ storage: storage });

// Account GET route
router.get('/account', (req, res) => {
  if (req.isAuthenticated()) {
    const defaultAvatar = '/img/avatars/default.jpg';
    const userAvatar = req.user.avatar || defaultAvatar;

    res.render('account', {
      currentUser: req.user,
      image_file: userAvatar,
      errors: {}
    });
  } else {
    res.redirect('/wiki/login');
  }
});

router.post('/account', upload.single('picture'), async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/wiki/login');
  }

  const { username, email, signature } = req.body;
  let avatar = req.user.avatar; // Current avatar path

  // Check if the user wants to revert to the default avatar
  if (req.body.defaultAvatar === 'on') {
    avatar = '/img/avatars/default.jpg'; // Path to the default avatar
  } else if (req.file) {
    avatar = `/img/avatars/${req.file.filename}`; // Update avatar path if a new file is uploaded
  }

  try {
    await User.update(
      { username, email, avatar, signature },
      { where: { id: req.user.id } }
    );
    res.redirect('/wiki/account');
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).send('Error updating user details.');
  }
});

module.exports = router;
