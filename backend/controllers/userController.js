const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.signupUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Invalid details' });
    }

    const normalizedEmail = email.toLowerCase();

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already taken' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      isApproved: false,
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully. Await admin approval.' });
  } catch (error) {
    console.error('Error during user signup:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'User not approved by admin' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

    res.cookie('user_jwt', token, {
      httpOnly: true,
      maxAge: 10800000,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
    });

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
