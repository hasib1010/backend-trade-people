// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const TradespersonProfile = require('../models/TradespersonProfile');
const { uploadToCloudinary } = require('../config/cloudinary');
const { sendEmail } = require('../config/email');

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @param {Boolean} remember - Whether to create a long-lived token
 * @returns {String} JWT token
 */
const generateToken = (user, remember = false) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: remember ? '30d' : '24h' }
  );
};

/**
 * Register a new customer
 */
const registerCustomer = async (req, res) => {
  try {
    console.log('Customer registration request received');
    
    const { firstName, lastName, email, phone, password, postcode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Upload profile image if provided
    let profileImageUrl = '';
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.path, 'customer-profiles');
        profileImageUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading profile image'
        });
      }
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 24*60*60*1000; // 24 hours

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      passwordHash: hashedPassword,
      postcode,
      role: 'customer',
      profilePicture: profileImageUrl,
      status: 'pending',
      verificationToken,
      verificationExpires
    });

    await newUser.save();
    
    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h1>Welcome to TradesPerson Platform</h1>
        <p>Hello ${firstName},</p>
        <p>Thank you for registering. Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.'
    });

  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

/**
 * Register a new tradesPerson
 */
const registerTradesperson = async (req, res) => {
  try {
    console.log('Tradesperson registration request received');
    
    const {
      firstName, lastName, email, phone, password,
      trade, postcode, experience, companyName,
      registrationNumber
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Process uploaded files
    const images = {};
    if (req.files) {
      try {
        for (const [key, files] of Object.entries(req.files)) {
          if (files && files[0]) {
            const result = await uploadToCloudinary(files[0].path, 'tradesPerson-profiles');
            images[key] = result.secure_url;
          }
        }
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading images'
        });
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 24*60*60*1000; // 24 hours

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      passwordHash: hashedPassword,
      postcode,
      role: 'tradesPerson',
      profilePicture: images.profileImage || '',
      status: 'pending',
      verificationToken,
      verificationExpires
    });

    await newUser.save();

    // Create tradesPerson profile
    const profile = new TradespersonProfile({
      userId: newUser._id,
      selectedTrade: trade,
      experience,
      certificationImage: images.licenseImage || '',
      companyName: companyName || '',
      insuranceImage: images.insuranceImage || '',
      companyRegistrationNumber: registrationNumber || '',
      profileCompletionProgress: calculateProfileCompletion(req.body, images),
      credits: 0
    });

    await profile.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Verify Your TradesPerson Account',
      html: `
        <h1>Welcome to TradesPerson Platform</h1>
        <p>Hello ${firstName},</p>
        <p>Thank you for registering as a tradesPerson. Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>After verification, our team will review your account details and approve your account.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.'
    });

  } catch (error) {
    console.error('Tradesperson registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

/**
 * Verify email with token
 */
const verifyEmail = async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await User.findOne({
        verificationToken: token,
        verificationExpires: { $gt: Date.now() }
      });
  
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification token'
        });
      }
  
      // Explicitly set emailVerified to true
      user.emailVerified = true;
  
      // Update user status
      if (user.role === 'customer') {
        user.status = 'active';
      } else {
        user.status = 'notverified'; // Tradesperson needs admin verification
      }
      
      user.verificationToken = undefined;
      user.verificationExpires = undefined;
      
      await user.save();
  
      res.json({
        success: true,
        message: user.role === 'customer' 
          ? 'Email verified successfully. You can now log in.' 
          : 'Email verified successfully. Your account is under review and will be activated shortly.'
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed'
      });
    }
  };

/**
 * Resend verification email
 */
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 24*60*60*1000; // 24 hours

    user.verificationToken = verificationToken;
    user.verificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h1>Email Verification</h1>
        <p>Hello ${user.firstName},</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>This link will expire in 24 hours.</p>
      `
    });

    res.json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
};

/**
 * User login
 */
const login = async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    console.log('Login attempt:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in',
        emailVerificationRequired: true
      });
    }

    // Check account status
    if (user.status === 'suspended') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.'
      });
    }

    if (user.status === 'pending' || user.status === 'notverified') {
      return res.status(401).json({
        success: false,
        message: 'Your account is awaiting approval. Please check back later.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user, remember);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    });

    // Return user info
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

/**
 * User logout
 */
const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

/**
 * Check authentication
 */
const checkAuth = async (req, res) => {
    try {
      // Use the decoded token id from middleware
      const user = await User.findById(req.user.id)
        .select('-passwordHash -verificationToken -verificationExpires');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
  
      // Get additional profile info for tradesPerson
      let additionalInfo = {};
      if (user.role === 'tradesPerson') {
        const profile = await TradespersonProfile.findOne({ userId: user._id });
        if (profile) {
          additionalInfo = {
            credits: profile.credits,
            subscription: profile.subscription,
            profileCompletion: profile.profileCompletionProgress
          };
        }
      }
  
      res.json({
        success: true,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          status: user.status,
          ...additionalInfo
        },
        role: user.role
      });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication check failed'
      });
    }
  };

/**
 * Forgot password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = Date.now() + 60*60*1000; // 1 hour
    
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h1>Password Reset</h1>
        <p>Hello ${user.firstName},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      `
    });

    res.json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user
    user.passwordHash = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

/**
 * Calculate profile completion percentage
 */
const calculateProfileCompletion = (data, images) => {
  const fields = [
    { name: 'selectedTrade', value: data.trade },
    { name: 'experience', value: data.experience },
    { name: 'certificationImage', value: images.licenseImage },
    { name: 'companyName', value: data.companyName },
    { name: 'insuranceImage', value: images.insuranceImage },
    { name: 'companyRegistrationNumber', value: data.registrationNumber }
  ];
  
  const completedFields = fields.filter(field => field.value).length;
  return Math.round((completedFields / fields.length) * 100);
};

module.exports = {
  registerCustomer,
  registerTradesperson,
  verifyEmail,
  resendVerificationEmail,
  login,
  logout,
  checkAuth,
  forgotPassword,
  resetPassword
};