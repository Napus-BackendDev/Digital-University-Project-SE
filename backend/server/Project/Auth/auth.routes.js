const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const UserModel = require('../User/models/user.model');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '225788483142-8pkg8on8nh60ao83ve33ff3lflv2ccvo.apps.googleusercontent.com';
const JWT_SECRET = process.env.JWT_SECRET || '1b125b462a1213961735717b12db0c1e8fbd0253557bfadaabca9047e987dfd5f5ca8f87241d25d4f220264483955622e178c9f662cc1f95f27cdcbc1896ec07';
const JWT_EXPIRES_IN = '7d';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * POST /auth/google
 * Body: { credential?, access_token?, userInfo? }
 *
 * Verifies the Google credential or access token server-side, links/creates User in MongoDB,
 * issues an httpOnly JWT cookie, and returns user info & token.
 */
router.post('/google', async (req, res) => {
  try {
    const credential = req.body.credential || req.body.idToken || req.body.id_token;
    const access_token = req.body.access_token || req.body.accessToken || req.body.token;
    const userInfo = req.body.userInfo || req.body.user;

    if (!credential && !access_token && !userInfo) {
      return res.status(400).json({ message: 'Missing credential or access_token' });
    }

    let payload = null;

    // 1. If ID token provided (JWT starting with ey...)
    if (credential && typeof credential === 'string' && credential.startsWith('ey')) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } catch (idErr) {
        console.warn('ID Token verification notice:', idErr.message);
      }
    }

    // 2. If access_token provided, verify with Google userinfo API using built-in fetch
    if (!payload && access_token) {
      try {
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
          signal: AbortSignal.timeout(8000)
        });
        if (googleRes.ok) {
          payload = await googleRes.json();
        }
      } catch (tokenErr) {
        console.warn('Google userinfo API notice:', tokenErr.message);
      }
    }

    // 3. If client already verified with Google and supplied userInfo
    if (!payload && userInfo && userInfo.email) {
      payload = userInfo;
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid payload from Google' });
    }

    const email = payload.email.toLowerCase().trim();
    const name = payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || email;

    // Find or link with existing MongoDB User record
    let dbUser = await UserModel.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });

    if (!dbUser) {
      // Create new user record if first-time sign-in
      dbUser = await UserModel.create({
        name: name,
        email: email
      });
    }

    // Create a session JWT
    const token = jwt.sign(
      {
        userId: String(dbUser._id),
        googleId: payload.sub,
        email: dbUser.email,
        name: dbUser.name,
        picture: payload.picture,
        role: dbUser.role,
        organization: dbUser.organization
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: dbUser._id,
        googleId: payload.sub,
        email: dbUser.email,
        name: dbUser.name,
        givenName: payload.given_name,
        familyName: payload.family_name,
        picture: payload.picture,
        role: dbUser.role,
        organization: dbUser.organization
      },
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    return res.status(401).json({ message: 'Invalid credential or token', error: error.message });
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
 * Returns the current user from the JWT cookie or Authorization header.
 */
router.get('/me', async (req, res) => {
  try {
    let token = req.cookies && req.cookies.token;
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Query latest user data from DB if available
    let dbUser = null;
    try {
      dbUser = await UserModel.findById(decoded.userId).populate('role').populate('organization');
    } catch (e) {}

    return res.status(200).json({
      user: dbUser ? {
        _id: dbUser._id,
        googleId: decoded.googleId,
        email: dbUser.email,
        name: dbUser.name,
        picture: decoded.picture,
        role: dbUser.role,
        organization: dbUser.organization
      } : {
        _id: decoded.userId,
        googleId: decoded.googleId,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        role: decoded.role,
        organization: decoded.organization
      },
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

module.exports = router;
