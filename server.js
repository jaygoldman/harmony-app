const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// JWT secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory store for connection codes (use Redis in production)
const connectionCodes = new Map();
const dataCache = new Map();
const JSON_CACHE_TTL_MS = 5 * 60 * 1000;
const DATA_LOCATIONS = [
  process.env.HARMONY_DATA_DIR && path.resolve(process.env.HARMONY_DATA_DIR),
  path.join(__dirname, 'build', 'data'),
  path.join(process.cwd(), 'build', 'data')
].filter(Boolean);

const resolvedDataFiles = new Map();

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

const resolveDataPath = async (filename) => {
  if (resolvedDataFiles.has(filename)) {
    return resolvedDataFiles.get(filename);
  }

  for (const candidateDir of DATA_LOCATIONS) {
    const filePath = path.join(candidateDir, filename);
    try {
      await fs.access(filePath);
      resolvedDataFiles.set(filename, filePath);
      return filePath;
    } catch {
      // Continue searching
    }
  }

  throw Object.assign(new Error(`Data file not found: ${filename}`), { code: 'DATA_FILE_NOT_FOUND' });
};

const readJsonResource = async (filename) => {
  const cached = dataCache.get(filename);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  let filePath;
  try {
    filePath = await resolveDataPath(filename);
  } catch (error) {
    if (error.code === 'DATA_FILE_NOT_FOUND') {
      throw Object.assign(
        new Error(`File not found in candidate data directories: ${DATA_LOCATIONS.join(', ')}`),
        { code: 'ENOENT' }
      );
    }
    throw error;
  }

  const raw = await fs.readFile(filePath, 'utf8');
  const payload = JSON.parse(raw);

  if (process.env.NODE_ENV === 'production') {
    dataCache.set(filename, { payload, expiresAt: Date.now() + JSON_CACHE_TTL_MS });
  }

  return payload;
};

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

app.get('/api/mobile/data/sample', verifyMobileToken, async (req, res) => {
  try {
    const data = await readJsonResource('sampleData.json');
    res.json(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Sample data not found' });
    }
    console.error('Failed to load sample data:', error);
    res.status(500).json({ error: 'Unable to load sample data' });
  }
});

app.get('/api/mobile/data/harmony-chats', verifyMobileToken, async (req, res) => {
  try {
    const data = await readJsonResource('harmonyChats.json');
    res.json(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Harmony chat data not found' });
    }
    console.error('Failed to load Harmony chat data:', error);
    res.status(500).json({ error: 'Unable to load Harmony chat data' });
  }
});

app.get('/api/mobile/data/kpis', verifyMobileToken, async (req, res) => {
  try {
    const data = await readJsonResource('kpiData.json');
    res.json(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'KPI data not found' });
    }
    console.error('Failed to load KPI data:', error);
    res.status(500).json({ error: 'Unable to load KPI data' });
  }
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
