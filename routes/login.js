const express = require('express');
const router = express.Router();
const passport = require('passport');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Ensure you're using bcryptjs for compatibility
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Redirect logged-in users from login page to account page
const redirectIfAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/wiki/account'); // Redirect to account if already logged in
    }
    next(); // Continue to the requested route if not logged in
};

// Validation rules
const userValidationRules = [
    check('username').notEmpty().withMessage('Username is required'),
    check('email').isEmail().withMessage('Email is invalid'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

// Register route
router.get('/register', (req, res) => {
    res.render('register', {
        errors: {},
        formData: {},
    });
});

// Register POST route
router.post('/register', userValidationRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('register', {
            errors: errors.mapped(),
            formData: req.body
        });
    }

    // Extract registration details from the request
    const { username, email, password } = req.body;

    try {
        // Check if the email is already registered
        const userByEmail = await User.findOne({ where: { email: email } });
        if (userByEmail) {
            req.flash('error_msg', 'Email is already registered');
            return res.redirect('/wiki/register');
        }

        // Check if the username is already taken
        let userByUsername = await User.findOne({ where: { username: username } });
        if (userByUsername) {
            req.flash('error_msg', 'Username is already taken');
            return res.redirect('/wiki/register');
        }

        // At this point, the email is not registered yet,
        // so you can proceed to create the user with the provided details
        const hashedPassword = await bcrypt.hash(password, 10);
        const defaultAvatar = '/img/avatars/default.jpg'; // Path to the default avatar image
        
        await User.create({
            username,
            email,
            password: hashedPassword,
            avatar: defaultAvatar
        });

        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/wiki/login');
    } catch (error) {
        console.error('Error during registration:', error);
        req.flash('error_msg', 'An unexpected error occurred during registration.');
        res.redirect('/wiki/register');
    }
});


// Login route
router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('login', {
        errors: {},
    });
});

// Login POST route
router.post('/login', passport.authenticate('local', {
    successRedirect: '/wiki/',
    failureRedirect: '/wiki/login',
    failureFlash: true
}));

// Logout route
router.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/wiki/login');
    });
});

// Configure the transporter with Mailchimp SMTP settings
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "1bf5eabf458377",
        pass: "9b66ef3896955b"
    }
});

//Reset password
router.get('/resetrequest', (req, res) => {
    // Always pass an errors object, empty if there are no errors
    res.render('resetrequest', {
        errors: {}
    });
});

async function sendResetEmail(email, link) {
    const mailOptions = {
        from: '"Wiki Site" <noreply@linkiowikis.com>', // Sender address
        to: email, // Recipient's email
        subject: 'Password Reset Request', // Subject line
        html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${link}">${link}</a></p>` // HTML body content
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}
  
// GET route to show the password reset form
router.get('/resetrequest/:resetToken', (req, res) => {
    const { resetToken } = req.params;
    if (resetToken) {
        // Include an empty errors object when rendering the template
        return res.render('resettoken', { resetToken: resetToken, errors: {} });
    }
    // If there's no resetToken, redirect or handle accordingly
    // e.g., res.redirect('/wiki/resetrequest');
});

// Route for submitting the email to get the reset link
router.post('/resetrequest', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
        return res.render('resetrequest', {
            errors: { email: 'No account found with that email address.' }
        });
    }

    const token = jwt.sign({ id: user.id }, 'your_secret_key', { expiresIn: '1h' });
    const resetLink = `http://localhost:3000/wiki/resetrequest/${token}`;

    // Send the password reset email
    await sendResetEmail(email, resetLink);

    req.flash('success_msg', 'A password reset link has been sent to your email.');
    res.redirect('/wiki/resetrequest');
});

// POST route for handling password reset with token
router.post('/resetrequest/:resetToken', async (req, res) => {
    const { resetToken } = req.params;
    const { password, confirmPassword } = req.body;

    // Example validation: Check if the passwords match
    if (password !== confirmPassword) {
        // Render the form again with an error message
        return res.render('resettoken', { 
            resetToken: resetToken, 
            errors: { confirmPassword: { msg: "Passwords do not match" } }
        });
    }
    
    try {
        // Verify the reset token
        const decoded = jwt.verify(resetToken, 'your_secret_key');
        const user = await User.findOne({ where: { id: decoded.id } });

        // Check if the user exists
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Check if the passwords match
        if (password !== confirmPassword) {
            // Handle password mismatch error
            return res.render('resettoken', { resetToken: resetToken, errors: { confirmPassword: { msg: "Passwords do not match" } } });
        }

        // Hash the new password and update the user's password
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.update({ password: hashedPassword }, { where: { id: user.id } });

        // Password reset successful, redirect or render success message
        res.send("Password has been reset successfully");
    } catch (error) {
        // Handle token expiration or other errors
        return res.status(400).send("Invalid or expired reset token");
    }
});

module.exports = router;
