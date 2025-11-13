const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  try {
    console.log('Generating token for user:', user._id);
    const token = generateToken(user._id);
    console.log('Token generated successfully');

    const response = {
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar
      }
    };

    console.log('Sending response with status:', statusCode);
    res.status(statusCode).json(response);
    console.log('Response sent successfully');
  } catch (error) {
    console.error('Error in sendTokenResponse:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating token response'
    });
  }
};

module.exports = { generateToken, sendTokenResponse };
