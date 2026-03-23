const jwt = require('jsonwebtoken');

const User = require('../models/User');

const auth = async (req, res, next) => {

  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) return res.status(401).send('No token');

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id);

    next();

  } catch (e) {

    res.status(401).send('Invalid token');

  }

};

module.exports = auth;