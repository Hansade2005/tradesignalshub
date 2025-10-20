# 🔐 User Authentication System

Complete authentication system for your app users using the auto-generated `users` table in your pipilot.dev database.

---

## 📋 Overview

The authentication system provides secure user signup, login, token verification, and token refresh capabilities for applications hosted on **Vercel, Netlify, or any platform**. 

### **Two-Layer Security Model**

1. **API Key**: Authenticates your application (obtained from pipilot.dev dashboard)
2. **JWT Token**: Authenticates individual users of your application

---

## 🏗️ Architecture

```
Your App (Vercel/Netlify)
    ↓ [API Key in header]
pipilot.dev API
    ↓ [Validates API key + Rate limiting]
Your Database (users table)
    ↓ [Returns JWT tokens]
Your App's Users
```

---

## 🚀 Quick Start

### **1. Get Your API Key**

1. Log into your [pipilot.dev dashboard](https://pipilot.dev/dashboard)
2. Navigate to your database
3. Go to **API Keys** tab
4. Click **Generate API Key**
5. Copy and save your API key securely

### **2. Store API Key Securely**

**Vercel:**
```bash
vercel env add PIPILOT_API_KEY
```

**Netlify:**
```bash
netlify env:set PIPILOT_API_KEY your_api_key_here
```

**.env.local (Development):**
```bash
PIPILOT_API_KEY=pk_live_your_api_key_here
PIPILOT_DATABASE_ID=your_database_id_here
```

---

## 📡 API Endpoints

Base URL: `https://pipilot.dev/api/v1/databases/{databaseId}/auth`

### **1. User Signup**

**Endpoint:** `POST /signup`

**Headers:**
```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "created_at": "2025-01-15T12:00:00Z",
    "updated_at": "2025-01-15T12:00:00Z"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400,
    "token_type": "Bearer"
  }
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

---

### **2. User Login**

**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "last_login": "2025-01-15T12:30:00Z"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400,
    "token_type": "Bearer"
  }
}
```

---

### **3. Verify Token**

**Endpoint:** `POST /verify`

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg"
  },
  "payload": {
    "userId": "uuid-here",
    "email": "user@example.com",
    "databaseId": "your-database-id",
    "iat": 1705320000,
    "exp": 1705406400
  }
}
```

---

### **4. Refresh Token**

**Endpoint:** `POST /refresh`

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 💻 Implementation Examples

### **Next.js 14 (App Router)**

#### **1. Create Auth Service**

`lib/auth.ts`:
```typescript
const API_BASE = 'https://pipilot.dev/api/v1/databases';
const DATABASE_ID = process.env.NEXT_PUBLIC_PIPILOT_DATABASE_ID!;
const API_KEY = process.env.PIPILOT_API_KEY!;

interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  };
}

export async function signup(
  email: string,
  password: string,
  full_name: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/${DATABASE_ID}/auth/signup`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, full_name }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }

  return response.json();
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/${DATABASE_ID}/auth/login`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
}

export async function verifyToken(token: string) {
  const response = await fetch(`${API_BASE}/${DATABASE_ID}/auth/verify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function refreshToken(refresh_token: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/${DATABASE_ID}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return response.json();
}
```

#### **2. Create Auth Context**

`contexts/AuthContext.tsx`:
```typescript
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { signup, login, verifyToken, refreshToken } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, full_name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('access_token');
    if (token) {
      verifyToken(token).then((data) => {
        if (data && data.valid) {
          setUser(data.user);
        } else {
          // Try to refresh token
          const refresh = localStorage.getItem('refresh_token');
          if (refresh) {
            refreshToken(refresh)
              .then((response) => {
                localStorage.setItem('access_token', response.tokens.access_token);
                setUser(response.user);
              })
              .catch(() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
              });
          }
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleSignup = async (email: string, password: string, full_name: string) => {
    const response = await signup(email, password, full_name);
    localStorage.setItem('access_token', response.tokens.access_token);
    localStorage.setItem('refresh_token', response.tokens.refresh_token);
    setUser(response.user);
  };

  const handleLogin = async (email: string, password: string) => {
    const response = await login(email, password);
    localStorage.setItem('access_token', response.tokens.access_token);
    localStorage.setItem('refresh_token', response.tokens.refresh_token);
    setUser(response.user);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup: handleSignup,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

### **React (Vite) Example**

#### **Auth Hook**

`hooks/useAuth.js`:
```javascript
import { useState, useEffect, createContext, useContext } from 'react';

const API_BASE = 'https://pipilot.dev/api/v1/databases';
const DATABASE_ID = import.meta.env.VITE_PIPILOT_DATABASE_ID;
const API_KEY = import.meta.env.VITE_PIPILOT_API_KEY;

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch(`${API_BASE}/${DATABASE_ID}/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setUser(data.user);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signup = async (email, password, full_name) => {
    const response = await fetch(`${API_BASE}/${DATABASE_ID}/auth/signup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, full_name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.tokens.access_token);
    localStorage.setItem('refresh_token', data.tokens.refresh_token);
    setUser(data.user);
  };

  const login = async (email, password) => {
    const response = await fetch(`${API_BASE}/${DATABASE_ID}/auth/login`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.tokens.access_token);
    localStorage.setItem('refresh_token', data.tokens.refresh_token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

---

## 🔒 Security Best Practices

### **1. Store Tokens Securely**

✅ **DO:**
- Use `localStorage` or `sessionStorage` for web apps
- Use secure storage (Keychain/Keystore) for mobile apps
- Use `httpOnly` cookies if possible (requires backend proxy)

❌ **DON'T:**
- Store tokens in plain text files
- Expose tokens in URLs or logs
- Commit tokens to version control

### **2. Handle Token Expiration**

```typescript
async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  let token = localStorage.getItem('access_token');
  
  // Add token to request
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  let response = await fetch(url, { ...options, headers });

  // If token expired, try refreshing
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      const refreshResponse = await refreshToken(refreshToken);
      localStorage.setItem('access_token', refreshResponse.tokens.access_token);
      
      // Retry original request with new token
      headers['Authorization'] = `Bearer ${refreshResponse.tokens.access_token}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
}
```

---

## 🛡️ Error Handling

### **Common Error Responses**

#### **400 Bad Request**
```json
{
  "error": "Invalid email format"
}
```

#### **409 Conflict**
```json
{
  "error": "User with this email already exists"
}
```

#### **429 Too Many Requests**
```json
{
  "error": "Rate limit exceeded",
  "limit": 1000,
  "usage": 1000,
  "reset_in": "1 hour"
}
```

---

## 📊 Token Structure

### **JWT Payload**

```json
{
  "userId": "uuid-here",
  "email": "user@example.com",
  "databaseId": "your-database-id",
  "iat": 1705320000,
  "exp": 1705406400
}
```

### **Token Expiration**

- **Access Token**: 24 hours
- **Refresh Token**: 7 days

---

## 🧪 Testing with cURL

### **Signup**
```bash
curl -X POST https://pipilot.dev/api/v1/databases/YOUR_DB_ID/auth/signup \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "full_name": "Test User"
  }'
```

### **Login**
```bash
curl -X POST https://pipilot.dev/api/v1/databases/YOUR_DB_ID/auth/login \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### **Verify Token**
```bash
curl -X POST https://pipilot.dev/api/v1/databases/YOUR_DB_ID/auth/verify \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

## 🚨 Troubleshooting

### **"Invalid API key format"**
- Ensure your API key starts with `pk_live_` or `pk_test_`
- Check that you're using the correct API key from your dashboard

### **"Password does not meet requirements"**
- Password must be at least 8 characters
- Must contain uppercase, lowercase, and number

### **"User with this email already exists"**
- Email is already registered
- Use login endpoint instead
- Or implement password reset flow

### **"Invalid or expired token"**
- Access token expired after 24 hours
- Use refresh token to get new access token
- Re-authenticate if refresh token expired

---

## 💡 Next Steps

1. **Test authentication flow** with cURL or Postman
2. **Implement signup/login** in your frontend
3. **Add token refresh logic** for seamless UX
4. **Protect routes** using authentication middleware
5. **Customize users table** with additional fields as needed

---

**Built with ❤️ by the pipilot.dev team**