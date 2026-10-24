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

// POST /wiki/account/disable - User self-deactivation / disable account
router.post('/account/disable', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/wiki/login');
  }

  const userId = req.user.id;
  const reason = req.body.reason || 'Deactivated by user request';

  try {
    await User.update({
      is_disabled: true,
      disabled_at: new Date(),
      disabled_reason: reason
    }, {
      where: { id: userId }
    });

    req.logout((err) => {
      if (err) console.error('Error during logout after account disable:', err);
      req.flash('success_msg', 'Your account has been deactivated successfully.');
      res.redirect('/wiki/');
    });
  } catch (error) {
    console.error('Error disabling account:', error);
    req.flash('error_msg', 'Failed to deactivate account.');
    res.redirect('/wiki/account');
  }
});

// Admin endpoints for disabling/enabling accounts
router.post('/admin/users/:id/disable', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const targetId = req.params.id;
  const reason = req.body.reason || 'Disabled by administrator';

  try {
    const user = await User.findByPk(targetId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      is_disabled: true,
      disabled_at: new Date(),
      disabled_reason: reason
    });

    res.json({ success: true, message: `Account ${user.username} has been disabled.` });
  } catch (err) {
    console.error('Error disabling user account:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/users/:id/enable', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const targetId = req.params.id;

  try {
    const user = await User.findByPk(targetId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      is_disabled: false,
      disabled_at: null,
      disabled_reason: null
    });

    res.json({ success: true, message: `Account ${user.username} has been re-enabled.` });
  } catch (err) {
    console.error('Error enabling user account:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
