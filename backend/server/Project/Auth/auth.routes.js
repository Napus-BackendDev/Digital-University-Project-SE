const express = require('express');
const router = express.Router();

const auth = require('./service/auth');

router.post("/login", auth.onLogin);
router.post("/register", auth.onRegister);
router.post("/logout", auth.onLogout);

module.exports = router;