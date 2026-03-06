const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../User/models/user.model');
const Role = require('../Role/models/role.model');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '1054366553517-29t3nkamhr0p9v6f3fbiq73evkvmq855.apps.googleusercontent.com';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1hr';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * POST /auth/google
 * Body: { credential: "<Google ID token>" }
 *
 * Verifies the Google credential server-side, upserts the user
 * in the database, then issues an httpOnly JWT cookie with
 * roles and permissions baked in.
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

    // Upsert user — create on first login, update profile on subsequent logins
    let user = await User.findOneAndUpdate(
      { googleId: payload.sub },
      {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        givenName: payload.given_name,
        familyName: payload.family_name,
        picture: payload.picture,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('roles');

    // If new user has no roles, assign default USER role (auto-create if missing)
    if (!user.roles || user.roles.length === 0) {
      let defaultRole = await Role.findOne({ name: 'USER' });
      if (!defaultRole) {
        defaultRole = await Role.create({
          name: 'USER',
          description: 'Student — view forms and submit responses',
        });
      }
      user.roles = [defaultRole._id];
      await user.save();
      user = await User.findById(user._id).populate('roles');
    }

    // Build role names
    const roleNames = user.roles.map(r => r.name);

    // Create a session JWT
    const token = jwt.sign(
      {
        userId: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        roles: roleNames,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    console.log('Generated token:', token);

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1 * 60 * 60 * 1000, // 1 hour
    });

    return res.status(200).json({
      message: 'Login successful',
      user: {
        _id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        roles: roleNames,
      },
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
 * Returns the current user from the JWT cookie (if valid),
 * including roles and permissions.
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies && req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Optionally re-fetch from DB for freshest roles
    const user = await User.findById(decoded.userId).populate('roles').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const roleNames = user.roles.map(r => r.name);

    return res.status(200).json({
      user: {
        _id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        roles: roleNames,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

module.exports = router;
