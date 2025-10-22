const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// JWT secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory store for connection codes (use Redis in production)
const connectionCodes = new Map();

// Middleware
app.use(cors()); // Enable CORS for all origins in development
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Clean up expired codes every minute
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of connectionCodes.entries()) {
    if (data.expiresAt < now) {
      connectionCodes.delete(code);
      console.log(`Expired code removed: ${code}`);
    }
  }
}, 60000);

// Middleware to verify Azure AD JWT token
const verifyAzureToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // For Azure AD tokens, we'll do basic validation
    // In production, you should validate against Azure AD's public keys
    const decoded = jwt.decode(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.user = {
      username: decoded.preferred_username || decoded.unique_name || decoded.email,
      name: decoded.name,
      email: decoded.email || decoded.preferred_username || decoded.unique_name
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ==================== MOBILE API ENDPOINTS ====================

// Register connection code (authenticated - requires SSO)
app.post('/api/mobile/register-code', verifyAzureToken, (req, res) => {
  const { code, username, expiresIn } = req.body;
  
  if (!code || !username) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  // Store code with user info
  connectionCodes.set(code, {
    username: req.user.username,
    name: req.user.name,
    email: req.user.email,
    expiresAt: expiresAt
  });
  
  console.log(`Code registered: ${code} for user: ${req.user.username}, expires: ${new Date(expiresAt).toISOString()}`);
  
  res.json({
    success: true,
    code: code,
    expiresAt: new Date(expiresAt).toISOString()
  });
});

// Connect with code (unauthenticated - public endpoint)
app.post('/api/mobile/connect', (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Missing connection code' });
  }
  
  // Look up code
  const userData = connectionCodes.get(code);
  
  if (!userData) {
    return res.status(400).json({ error: 'Invalid or expired connection code' });
  }
  
  // Check if expired
  if (userData.expiresAt < Date.now()) {
    connectionCodes.delete(code);
    return res.status(400).json({ error: 'Invalid or expired connection code' });
  }
  
  // Generate JWT token for mobile app
  const mobileToken = jwt.sign(
    {
      username: userData.username,
      email: userData.email,
      name: userData.name,
      type: 'mobile'
    },
    JWT_SECRET,
    { expiresIn: '30d' } // Mobile token valid for 30 days
  );
  
  // Delete the code after successful use (one-time use)
  connectionCodes.delete(code);
  
  console.log(`Mobile connected successfully for user: ${userData.username}`);
  
  res.json({
    success: true,
    token: mobileToken,
    username: userData.username,
    name: userData.name,
    email: userData.email,
    apiUrl: `${req.protocol}://${req.get('host')}`
  });
});

// Verify mobile JWT token (for subsequent mobile API calls)
const verifyMobileToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Example protected endpoint for mobile app
app.get('/api/mobile/dashboard-summary', verifyMobileToken, (req, res) => {
  res.json({
    username: req.user.username,
    projects: {
      total: 12,
      active: 8,
      atRisk: 2,
      completed: 2
    },
    recentActivity: [],
    upcomingReviews: []
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    activeCodes: connectionCodes.size
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
