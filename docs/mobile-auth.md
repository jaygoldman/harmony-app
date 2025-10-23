# Mobile App Authentication Guide

## Overview

This document describes the authentication flow for connecting the Harmony mobile app to the desktop application. The mobile app uses a **connection code system** where the desktop generates a short code that the mobile app can scan or enter manually to establish a secure connection.

## Authentication Flow

### 1. User Initiates Connection

**Desktop App:**
1. User clicks on their profile icon in the top-right corner
2. Selects "Connect Mobile App" from the dropdown menu
3. Modal appears with QR code and connection instructions

### 2. Connection Code Generation

**Frontend Process:**
```javascript
// Generate a short random connection code (8 characters)
const connectionCode = Math.random().toString(36).substring(2, 10).toUpperCase();

// Acquire MSAL token
const response = await instance.acquireTokenSilent({
  scopes: ['openid', 'profile', 'email'],
  account: accounts[0]
});

// Register the code with backend (associates code with user's session)
await fetch(`${window.location.origin}/api/mobile/register-code`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${response.accessToken}`
  },
  body: JSON.stringify({
    code: connectionCode,
    username: account.username,
    expiresIn: 600 // 10 minutes in seconds
  })
});

// Create QR code payload (much shorter!)
const connectionPayload = {
  code: connectionCode,              // Short 8-character code
  apiUrl: window.location.origin     // API base URL
};

// QR code contains JSON-encoded payload
const qrCodeData = JSON.stringify(connectionPayload);
```

**Example QR Code Payload:**
```json
{
  "code": "X7K9M2WP",
  "apiUrl": "https://app.example.com"
}
```

**Connection Code Features:**
- Short 8-character alphanumeric code (e.g., "X7K9M2WP")
- Valid for 10 minutes only
- Can be scanned via QR code OR entered manually in the mobile app
- Backend stores mapping: code → user session
- Automatically refreshes every 10 minutes

### 3. Mobile App Scans QR Code or Enters Code

**Mobile App Process:**
1. User opens mobile app and navigates to "Connect to Desktop"
2. **Option A:** Scans QR code using device camera
   - OR **Option B:** Manually enters the 8-character code in a text field
3. Parses JSON payload from QR code (or constructs from manual entry)
4. Extracts connection code and apiUrl
5. Calls backend `/api/mobile/connect` endpoint with the code
6. Backend returns user info and session token
7. Stores credentials securely in device storage

**Mobile App Implementation (Pseudo-code):**
```javascript
// Option A: Parse QR code data
const connectionData = JSON.parse(qrCodeData);

// Option B: Manual entry
// const connectionData = {
//   code: userEnteredCode,
//   apiUrl: 'https://app.example.com' // Or prompt user for this
// };

// Validate payload
if (!connectionData.code || !connectionData.apiUrl) {
  throw new Error('Invalid connection data');
}

// Connect to backend using the code
const response = await fetch(`${connectionData.apiUrl}/api/mobile/connect`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    code: connectionData.code
  })
});

const result = await response.json();
// Result contains: { success, token, username, name, email, apiUrl }

// Store securely (use secure storage like Keychain/Keystore)
await SecureStorage.set('authToken', result.token);
await SecureStorage.set('apiUrl', result.apiUrl);
await SecureStorage.set('username', result.username);
await SecureStorage.set('userEmail', result.email);
await SecureStorage.set('userName', result.name);

// Test connection
await testConnection();
```

## API Endpoints

### Base URL
Use the `apiUrl` from the QR code payload as the base URL for all API calls.

Example: `https://app.example.com`

### Authentication Header
All API requests must include the JWT token in the Authorization header:

```http
Authorization: Bearer <token>
```

### Available Endpoints

#### 1. Register Connection Code (Backend)
**Endpoint:** `POST /api/mobile/register-code`

**Description:** Desktop app calls this to register a new connection code. This endpoint is **authenticated** and requires the user's JWT token.

**Headers:**
```http
Authorization: Bearer <desktop-user-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "X7K9M2WP",
  "username": "user@example.com",
  "expiresIn": 600
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "code": "X7K9M2WP",
  "expiresAt": "2024-01-20T15:40:00Z"
}
```

---

#### 2. Connect with Code (Mobile)
**Endpoint:** `POST /api/mobile/connect`

**Description:** Mobile app calls this with the scanned/entered code to establish connection. Returns user info and a session token for the mobile app.

**Headers:**
```http
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "X7K9M2WP"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "mobile-session-token-here",
  "username": "user@example.com",
  "name": "John Doe",
  "email": "user@example.com",
  "apiUrl": "https://app.example.com"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Invalid or expired connection code"
}
```

**Example cURL:**
```bash
curl -X POST https://app.example.com/api/mobile/connect \
  -H "Content-Type: application/json" \
  -d '{"code": "X7K9M2WP"}'
```

---

#### 3. Test Connection
**Endpoint:** `POST /api/mobile/test-connection`

**Description:** Validates the JWT token and confirms successful connection.

**Headers:**
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Connection successful",
  "username": "user@example.com",
  "serverTime": "2024-01-20T15:30:00Z"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid or expired token"
}
```

**Example cURL:**
```bash
curl -X POST https://app.example.com/api/mobile/test-connection \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

#### 2. Dashboard Summary
**Endpoint:** `GET /api/mobile/dashboard-summary`

**Description:** Retrieves user's dashboard summary including project counts and recent activity.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "username": "user@example.com",
  "projects": {
    "total": 12,
    "active": 8,
    "atRisk": 2,
    "completed": 2
  },
  "recentActivity": [
    {
      "type": "review",
      "project": "3D Print Capabilities",
      "message": "Harmony reviewed project status",
      "timestamp": "2024-01-20T13:30:00Z"
    },
    {
      "type": "update",
      "project": "ERP Migration",
      "message": "Budget updated to $3.8M",
      "timestamp": "2024-01-20T10:30:00Z"
    }
  ],
  "upcomingReviews": [
    {
      "project": "ESG Initiative",
      "scheduledFor": "2024-01-22T15:30:00Z"
    }
  ]
}
```

**Example cURL:**
```bash
curl -X GET https://app.example.com/api/mobile/dashboard-summary \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### 3. Notifications
**Endpoint:** `GET /api/mobile/notifications`

**Description:** Retrieves user's notifications with unread count.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "username": "user@example.com",
  "notifications": [
    {
      "id": 1,
      "type": "review",
      "title": "Project Review Available",
      "message": "Harmony has completed a review of 3D Print Capabilities",
      "timestamp": "2024-01-20T14:30:00Z",
      "read": false
    },
    {
      "id": 2,
      "type": "alert",
      "title": "Budget Alert",
      "message": "ERP Migration approaching budget threshold",
      "timestamp": "2024-01-20T11:30:00Z",
      "read": false
    },
    {
      "id": 3,
      "type": "info",
      "title": "Team Update",
      "message": "New team member added to Transformation project",
      "timestamp": "2024-01-19T15:30:00Z",
      "read": true
    }
  ],
  "unreadCount": 2
}
```

**Example cURL:**
```bash
curl -X GET https://app.example.com/api/mobile/notifications \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Security Considerations

### Token Storage
- **Mobile App:** Store JWT tokens in secure storage (iOS Keychain, Android Keystore)
- **Never store tokens in plain text or shared preferences**
- Clear tokens when user logs out or disconnects

### Token Expiration
- JWT tokens follow the backend's configured expiration time (typically 24 hours)
- Mobile app should handle 401 Unauthorized responses gracefully
- When token expires, user must scan a new QR code
- Consider implementing token refresh if needed

### HTTPS
- All API requests MUST use HTTPS in production
- Do not send JWT tokens over unencrypted connections

### QR Code Security
- QR codes expire after 10 minutes (auto-refresh on desktop)
- Tokens are only valid for the duration specified in JWT
- Users should not share QR code screenshots
- Display warning in UI: "Do not share this QR code with anyone"

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "error": "Invalid or expired token"
}
```
**Action:** Prompt user to reconnect by scanning new QR code

**403 Forbidden:**
```json
{
  "error": "Insufficient permissions"
}
```
**Action:** Show error message, user may need to contact administrator

**500 Internal Server Error:**
```json
{
  "error": "Server error occurred"
}
```
**Action:** Show generic error, retry with exponential backoff

### Mobile App Error Handling Flow

```javascript
async function makeAuthenticatedRequest(endpoint) {
  const token = await SecureStorage.get('authToken');
  const apiUrl = await SecureStorage.get('apiUrl');
  
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      // Token expired or invalid
      await clearCredentials();
      navigateToConnectionScreen();
      throw new Error('Session expired. Please reconnect.');
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

## Backend Implementation

### Required Changes

If your backend doesn't already have mobile endpoints, create them with the following structure:

**Python/Flask Example:**
```python
from flask import Blueprint, jsonify, request
from functools import wraps
import jwt
from datetime import datetime

mobile_bp = Blueprint('mobile', __name__, url_prefix='/api/mobile')

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            # Verify JWT token (use your secret key)
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            account = payload  # Extract account info from payload
            
            # Pass account to the route handler
            return f(account, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Invalid or expired token'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid or expired token'}), 401
    
    return decorated_function

@mobile_bp.route('/test-connection', methods=['POST'])
@require_auth
def test_connection(account):
    return jsonify({
        'success': True,
        'message': 'Connection successful',
        'username': account['username'],
        'serverTime': datetime.utcnow().isoformat()
    })

@mobile_bp.route('/dashboard-summary', methods=['GET'])
@require_auth
def get_dashboard_summary(account):
    # Return user-specific dashboard data
    return jsonify({
        'username': account['username'],
        'projects': {
            'total': 12,
            'active': 8,
            'atRisk': 2,
            'completed': 2
        },
        # ... more data
    })

@mobile_bp.route('/notifications', methods=['GET'])
@require_auth
def get_notifications(account):
    # Return user-specific notifications
    return jsonify({
        'username': account['username'],
        'notifications': [],
        'unreadCount': 0
    })
```

### No Changes Needed If:
- You already have authentication middleware that validates JWT tokens
- Your endpoints already use `@require_auth` or similar decorators
- Your JWT token format is compatible

Simply apply your existing authentication decorator to the mobile endpoints!

## Testing

### Manual Testing

1. **Desktop → Mobile Connection:**
   - Open desktop app
   - Click profile → "Connect Mobile App"
   - Use a QR code reader app to scan and verify payload
   - Check that JSON payload is valid

2. **Mobile App → API:**
   - Use the token from QR code
   - Make cURL requests to test each endpoint
   - Verify 200 OK responses with valid token
   - Verify 401 Unauthorized with invalid/expired token

3. **Token Expiration:**
   - Wait for token to expire (based on JWT expiration time)
   - Verify mobile app handles 401 response correctly
   - Verify user is prompted to reconnect

### Automated Testing

```javascript
// Example Jest/React Native test
describe('Mobile Authentication', () => {
  it('should parse QR code payload correctly', () => {
    const qrData = JSON.stringify({
      token: 'test-token',
      apiUrl: 'https://test.example.com',
      username: 'test@example.com',
      timestamp: Date.now()
    });
    
    const parsed = JSON.parse(qrData);
    expect(parsed.token).toBe('test-token');
    expect(parsed.apiUrl).toBe('https://test.example.com');
  });
  
  it('should include Authorization header in requests', async () => {
    const response = await api.testConnection('test-token');
    expect(response.headers.Authorization).toBe('Bearer test-token');
  });
  
  it('should handle 401 responses', async () => {
    // Mock 401 response
    fetch.mockResponseOnce(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401
    });
    
    await expect(api.getDashboard()).rejects.toThrow('Session expired');
  });
});
```

## Troubleshooting

### Issue: Mobile app can't connect

**Possible causes:**
1. Token expired → Scan new QR code
2. Wrong API URL → Verify apiUrl in QR payload
3. Network connectivity → Check internet connection
4. CORS issues (development only) → Configure CORS on backend

### Issue: 401 Unauthorized errors

**Possible causes:**
1. Token expired → Scan new QR code
2. Token not included in header → Check Authorization header format
3. Invalid token format → Ensure "Bearer " prefix is included
4. Backend JWT secret mismatch → Verify backend configuration

### Issue: QR code won't scan

**Possible causes:**
1. QR code too large → Payload should be < 2KB
2. Low contrast → Check QR code rendering
3. Camera permissions → Enable camera in mobile app
4. Damaged QR code → Refresh modal to generate new code

## Future Enhancements

### Potential Improvements:
1. **Token Refresh:** Implement refresh token mechanism to avoid re-scanning
2. **Push Notifications:** Register device tokens for push notifications
3. **Biometric Auth:** Add fingerprint/face ID for mobile app access
4. **Multi-Device:** Support multiple connected devices per user
5. **Device Management:** Allow users to view/revoke connected devices

## Support

For questions or issues with mobile authentication:
1. Check this documentation first
2. Verify JWT token format and expiration
3. Test endpoints with cURL before mobile implementation
4. Check backend logs for authentication errors
5. Ensure HTTPS is enabled in production

---

**Last Updated:** January 2024
**Version:** 1.0
