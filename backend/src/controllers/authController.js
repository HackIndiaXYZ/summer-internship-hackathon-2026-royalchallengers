const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');

const register = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (err) {
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(`[Auth] Login attempt for: ${email} with password: ${password}`);

  // Developer Bypass for rapid testing
  if (email === 'dev@medoveda.com' && password === 'ClinicalPilot2026') {
    console.log('[Auth] Developer bypass triggered.');
    return res.json({
      user: { id: '00000000-0000-0000-0000-000000000000', email: 'dev@medoveda.com', name: 'Clinical Supervisor' },
      token: 'dev-bypass-token'
    });
  }

  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      console.warn(`[Auth] No user found for: ${email}`);
      return res.status(401).json({ error: 'Specialist account not found.' });
    }
    
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.warn(`[Auth] Password mismatch for: ${email}`);
      return res.status(401).json({ error: 'Invalid clinical credentials.' });
    }
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback-secret');
    console.log(`[Auth] Login successful for: ${email}`);
    res.json({ 
      user: { id: user.id, email: user.email, name: user.name }, 
      token 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login };
