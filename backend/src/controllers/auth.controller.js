const jwt = require('jsonwebtoken');
const config = require('../config');
const UserModel = require('../models/user.model');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, organization, vesselName, preferredSector } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length'
      });
    }

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    const newUser = await UserModel.create({
      name,
      email,
      password,
      role: role || 'fisherman',
      organization: organization || '',
      vesselName: vesselName || '',
      preferredSector: preferredSector || 'Arabian Sea / Mumbai Coast'
    });

    const token = generateToken(newUser);
    const sanitizedUser = UserModel.sanitizeUser(newUser);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: sanitizedUser
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password'
      });
    }

    const isMatch = await UserModel.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password'
      });
    }

    const token = generateToken(user);
    const sanitizedUser = UserModel.sanitizeUser(user);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: sanitizedUser
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout
};
