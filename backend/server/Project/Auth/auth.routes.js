const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcrypt');
const User = require('../User/models/user.model');
const { authenticate } = require('../../../middleware/authorization');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

function setSessionCookie(res, user) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  const token = jwt.sign({ userId: String(user._id) }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && /^https:\/\//i.test(process.env.FRONTEND_URL || ''),
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).populate('role');
    if (!user || !user.password) return res.status(401).json({ message: 'Invalid email or password' });
    const isHash = String(user.password).startsWith('$2');
    const valid = isHash ? await bcrypt.compare(password, user.password) : password === user.password;
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });
    if (!isHash) {
      user.password = await bcrypt.hash(password, 12);
      await user.save();
    }
    setSessionCookie(res, user);
    return res.status(200).json({ user: user.toJSON() });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to sign in' });
  }
});

/**
 * POST /auth/google
 * Body: { credential: "<Google ID token>" }
 *
 * Verifies the Google credential server-side, then issues
 * an httpOnly JWT cookie and returns user info.
 */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Missing credential token' });
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const user = {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      givenName: payload.given_name,
      familyName: payload.family_name,
      picture: payload.picture,
    };

    // Create a session JWT
    const token = jwt.sign(
      { userId: user.googleId, email: user.email, name: user.name, picture: user.picture },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && /^https:\/\//i.test(process.env.FRONTEND_URL || ''),
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      message: 'Login successful',
      user,
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    return res.status(401).json({ message: 'Invalid credential', error: error.message });
  }
});

/**
 * POST /auth/logout
 * Clears the session cookie.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out' });
});

/**
 * GET /auth/me
 * Returns the current user from the JWT cookie (if valid).
 */
router.get('/me', authenticate, (req, res) => {
  const user = { ...req.authUser };
  delete user.password;
  return res.status(200).json({ user });
});

module.exports = router;
