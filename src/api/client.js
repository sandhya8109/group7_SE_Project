// Default to mock APIs so the app works out of the box without a backend.
// Set VITE_USE_MOCK="false" to force real API calls.
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function delay(ms){ return new Promise(r=>setTimeout(r, ms)) }

export async function apiFetch(path, { method='GET', body, token } = {}){
  if (USE_MOCK) {
    // Simulate a server for auth endpoints
    await delay(400)
    if (path === '/auth/login' && method === 'POST') {
      const { email, password } = JSON.parse(body || '{}')
      const users = JSON.parse(localStorage.getItem('pfbms-users') || '[]')
      const found = users.find(u => u.email === email && u.password === password)
      if (!found) throw new Error('Invalid email or password')
      return { token: 'mock-token', user: { email } }
    }
    if (path === '/auth/signup' && method === 'POST') {
      const { email, password } = JSON.parse(body || '{}')
      const users = JSON.parse(localStorage.getItem('pfbms-users') || '[]')
      if (users.find(u => u.email === email)) throw new Error('Email already registered')
      users.push({ email, password })
      localStorage.setItem('pfbms-users', JSON.stringify(users))
      return { token: 'mock-token', user: { email } }
    }
    if (path === '/auth/me' && method === 'GET') {
      return { user: { email: 'session@example.com' } }
    }
    if (path === '/dashboard' && method === 'GET') {
      return { ok: true }
    }
    throw new Error('Mock endpoint not implemented: '+method+' '+path)
  }
  const res = await fetch(BASE_URL + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || ('HTTP '+res.status))
  }
  return res.json()
}
