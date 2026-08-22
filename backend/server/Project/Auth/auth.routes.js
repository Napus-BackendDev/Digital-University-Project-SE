const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcrypt');
const User = require('../User/models/user.model');
const Role = require('../User/models/roles.model');
const { authenticate } = require('../../../middleware/authorization');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || process.env.KEY || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d';
const ALLOWED_EMAIL_DOMAINS = (process.env.AUTH_ALLOWED_EMAIL_DOMAINS || '')
  .split(',')
  .map(domain => domain.trim().toLowerCase())
  .filter(Boolean);

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

function getCookieSecure() {
  if (process.env.COOKIE_SECURE !== undefined) {
    return process.env.COOKIE_SECURE === 'true';
  }
  return process.env.NODE_ENV === 'production';
}

function serializeUser(user) {
  return {
    _id: user._id,
    googleId: user.googleId,
    email: user.email,
    name: user.name,
    picture: user.picture,
    role: user.role || null,
    organization: user.organization || null,
  };
}

function getEmailDomain(email) {
  return String(email || '').split('@').pop().toLowerCase();
}

function isAllowedEmailDomain(email) {
  return ALLOWED_EMAIL_DOMAINS.length === 0 || ALLOWED_EMAIL_DOMAINS.includes(getEmailDomain(email));
}

function setSessionCookie(res, user) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  const token = jwt.sign({ userId: String(user._id) }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.cookie('token', token, {
    httpOnly: true,
    secure: getCookieSecure(),
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
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google OAuth client ID is not configured' });
    }

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

    if (!payload.email || payload.email_verified === false) {
      return res.status(401).json({ message: 'Google account email is not verified' });
    }

    const email = payload.email.toLowerCase();
    if (!isAllowedEmailDomain(email)) {
      return res.status(403).json({ message: 'This Google account is not allowed to sign in' });
    }

    let user = await User.findOne({
      $or: [
        { googleId: payload.sub },
        { email },
      ],
    })
      .populate('role')
      .populate('organization', 'title');

    if (user) {
      user.googleId = payload.sub;
      user.name = user.name || payload.name;
      user.picture = payload.picture;
      await user.save();
      user = await User.findById(user._id)
        .populate('role')
        .populate('organization', 'title');
    } else {
      const defaultRole = await Role.findOne({ 'title.value': 'User' });
      user = await User.create({
        googleId: payload.sub,
        email,
        name: payload.name,
        picture: payload.picture,
        role: defaultRole ? defaultRole._id : undefined,
      });
      user = await User.findById(user._id)
        .populate('role')
        .populate('organization', 'title');
    }

    // Create a session JWT
    const token = jwt.sign(
      {
        userId: String(user._id),
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: getCookieSecure(),
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      message: 'Login successful',
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Google auth error');
    return res.status(401).json({ message: 'Invalid Google credential' });
  }
});

/**
 * POST /auth/logout
 * Clears the session cookie.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: getCookieSecure(),
    sameSite: 'lax',
  });
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
