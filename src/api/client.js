// Default to mock APIs so the app works out of the box without a backend.
// Set VITE_USE_MOCK="false" to force real API calls.
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

function delay(ms){ return new Promise(r=>setTimeout(r, ms)) }

// Mock localStorage keys
const MOCK_TRANSACTIONS_KEY = 'pfbms-mock-transactions'
const MOCK_REMINDERS_KEY = 'pfbms-mock-reminders'

// Helper to get mock transactions
function getMockTransactions() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_TRANSACTIONS_KEY) || '[]')
  } catch {
    return []
  }
}

// Helper to save mock transactions
function saveMockTransactions(transactions) {
  localStorage.setItem(MOCK_TRANSACTIONS_KEY, JSON.stringify(transactions))
}

// Helper to get mock reminders
function getMockReminders() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_REMINDERS_KEY) || '[]')
  } catch {
    return []
  }
}

// Helper to save mock reminders
function saveMockReminders(reminders) {
  localStorage.setItem(MOCK_REMINDERS_KEY, JSON.stringify(reminders))
}

export async function apiFetch(path, { method='GET', body, token } = {}){
  if (USE_MOCK) {
    console.log('[MOCK API]', method, path); // Debug logging
    await delay(400)
    
    // ==================== AUTH ENDPOINTS ====================
    if (path === '/auth/login' && method === 'POST') {
      const { email, password } = JSON.parse(body || '{}')
      const users = JSON.parse(localStorage.getItem('pfbms-users') || '[]')
      const found = users.find(u => u.email === email && u.password === password)
      if (!found) throw new Error('Invalid email or password')
      return { token: 'mock-token', user: { user_id: 'mock-user-1', email } }
    }
    
    if (path === '/auth/signup' && method === 'POST') {
      const { email, password } = JSON.parse(body || '{}')
      const users = JSON.parse(localStorage.getItem('pfbms-users') || '[]')
      if (users.find(u => u.email === email)) throw new Error('Email already registered')
      users.push({ email, password })
      localStorage.setItem('pfbms-users', JSON.stringify(users))
      return { token: 'mock-token', user: { user_id: 'mock-user-1', email } }
    }
    
    if (path === '/auth/me' && method === 'GET') {
      return { user: { user_id: 'mock-user-1', email: 'session@example.com' } }
    }
    
    if (path === '/dashboard' && method === 'GET') {
      return { ok: true }
    }
    
    // ==================== TRANSACTION ENDPOINTS ====================
    if (path.startsWith('/transactions')) {
      // GET all transactions for a user
      if (method === 'GET' && path.match(/^\/transactions\/[\w-]+$/)) {
        const transactions = getMockTransactions()
        return transactions
      }
      
      // CREATE new transaction
      if (path === '/transactions' && method === 'POST') {
        const newTransaction = JSON.parse(body || '{}')
        const transactions = getMockTransactions()
        const id = `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const transaction = {
          id: id,
          transaction_id: id,
          ...newTransaction,
          created_at: new Date().toISOString()
        }
        transactions.push(transaction)
        saveMockTransactions(transactions)
        return transaction
      }
      
      // UPDATE transaction
      if (method === 'PUT' && path.match(/^\/transactions\/[\w-]+$/)) {
        const id = path.split('/').pop()
        const updates = JSON.parse(body || '{}')
        const transactions = getMockTransactions()
        const index = transactions.findIndex(t => t.id === id || t.transaction_id === id)
        if (index === -1) throw new Error('Transaction not found')
        transactions[index] = { ...transactions[index], ...updates }
        saveMockTransactions(transactions)
        return transactions[index]
      }
      
      // DELETE transaction
      if (method === 'DELETE' && path.match(/^\/transactions\/[\w-]+/)) {
        // Extract ID from path like /transactions/txn-123?user_id=user-456
        const pathParts = path.split('?')[0].split('/')
        const id = pathParts[pathParts.length - 1]
        const transactions = getMockTransactions()
        const filtered = transactions.filter(t => t.id !== id && t.transaction_id !== id)
        saveMockTransactions(filtered)
        return { success: true, deleted: id }
      }
    }
    
    // ==================== REMINDER ENDPOINTS ====================
    if (path.startsWith('/reminders')) {
      // GET all reminders for a user
      if (method === 'GET' && path.match(/^\/reminders\/[\w-]+$/)) {
        const reminders = getMockReminders()
        return reminders
      }
      
      // CREATE new reminder
      if (path === '/reminders' && method === 'POST') {
        const newReminder = JSON.parse(body || '{}')
        console.log('[MOCK] Creating reminder with data:', newReminder); // Debug
        
        // Validate required fields
        if (!newReminder.title || !newReminder.amount || !newReminder.due_date) {
          console.error('[MOCK] Missing required fields:', { 
            title: newReminder.title, 
            amount: newReminder.amount, 
            due_date: newReminder.due_date 
          });
          throw new Error(JSON.stringify({ error: "Missing required reminder fields" }))
        }
        
        const reminders = getMockReminders()
        const id = `rem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const reminder = {
          id: id,
          reminder_id: id,
          ...newReminder,
          created_at: new Date().toISOString()
        }
        console.log('[MOCK] Created reminder:', reminder); // Debug
        reminders.push(reminder)
        saveMockReminders(reminders)
        return reminder
      }
      
      // UPDATE reminder
      if (method === 'PUT' && path.match(/^\/reminders\/[\w-]+$/)) {
        const id = path.split('/').pop()
        const updates = JSON.parse(body || '{}')
        const reminders = getMockReminders()
        const index = reminders.findIndex(r => r.id === id || r.reminder_id === id)
        if (index === -1) throw new Error('Reminder not found')
        reminders[index] = { ...reminders[index], ...updates }
        saveMockReminders(reminders)
        return reminders[index]
      }
      
      // DELETE reminder
      if (method === 'DELETE' && path.match(/^\/reminders\/[\w-]+/)) {
        // Extract ID from path like /reminders/rem-123?user_id=user-456
        const pathParts = path.split('?')[0].split('/')
        const id = pathParts[pathParts.length - 1]
        console.log('[MOCK] Deleting reminder with ID:', id); // Debug
        const reminders = getMockReminders()
        console.log('[MOCK] Current reminders:', reminders.map(r => ({id: r.id, reminder_id: r.reminder_id}))); // Debug
        const filtered = reminders.filter(r => r.id !== id && r.reminder_id !== id)
        console.log('[MOCK] After filter:', filtered.length, 'reminders remaining'); // Debug
        saveMockReminders(filtered)
        return { success: true, deleted: id }
      }
    }
    
    throw new Error('Mock endpoint not implemented: '+method+' '+path)
  }
  
  // Real API call
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

export const fetchDashboardSummary = (userId, token) => {
  const path = `/dashboard/summary/${userId}`
  
  if (USE_MOCK) {
    // --- Mock Implementation for Dashboard Summary ---
    const mockData = {
      totals: { income: 5200000, expense: 4500000, savings: 700000 },
      monthly_trend: [
        { month: "2024-07", income: 400000, expense: 350000 },
        { month: "2024-08", income: 500000, expense: 420000 },
        { month: "2024-09", income: 450000, expense: 380000 },
        { month: "2024-10", income: 600000, expense: 410000 },
        { month: "2024-11", income: 520000, expense: 400000 },
        { month: "2024-12", income: 550000, expense: 430000 },
      ],
      expense_breakdown: [
        { name: 'Rent', value: 1200000 },
        { name: 'Groceries', value: 800000 },
        { name: 'Utilities', value: 300000 },
        { name: 'Transportation', value: 200000 },
        { name: 'Entertainment', value: 500000 },
      ],
      notifications: [
        { id: 1, message: 'You exceeded your Groceries budget by 10%.', type: 'overspending', date: '2024-12-01T10:00:00Z' },
        { id: 2, message: 'Rent payment is due tomorrow.', type: 'due-soon', date: '2024-11-28T12:00:00Z' },
      ],
      reminders: [
        { id: 101, title: 'Rent Payment', amount: 1200000, dueDate: '2025-01-01' },
        { id: 102, title: 'Car Insurance', amount: 500000, dueDate: '2024-12-25' },
      ],
      weekly_transactions: [
        { amount: 50000, date: '2024-12-01', type: 'expense', category: 'Groceries' },
        { amount: 15000, date: '2024-11-29', type: 'expense', category: 'Transportation' },
        { amount: 20000, date: '2024-11-25', type: 'expense', category: 'Entertainment' },
        { amount: 10000, date: '2024-11-20', type: 'income', category: 'Gift' },
      ],
    }
    
    return delay(400).then(() => mockData)
  }
  
  // Real API call
  return apiFetch(path, { token: token })
}


// ==================== TRANSACTION API FUNCTIONS  ====================

export const fetchTransactions = (userId, token) => {
  return apiFetch(`/transactions/${userId}`, { token: token });
};

export const createTransaction = (data, token) => {
  return apiFetch('/transactions', { method: 'POST', body: JSON.stringify(data), token: token });
};

export const updateTransaction = (id, data, token) => {
  return apiFetch(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data), token: token });
};

export const deleteTransaction = (id, userId, token) => {
  return apiFetch(`/transactions/${id}?user_id=${userId}`, { method: 'DELETE', token: token });
};


// ==================== REMINDER API FUNCTIONS  ====================

export const fetchReminders = (userId, token) => {
  return apiFetch(`/reminders/${userId}`, { token: token });
};

export const createReminder = (data, token) => {
  return apiFetch('/reminders', { method: 'POST', body: JSON.stringify(data), token: token });
};

export const updateReminder = (id, data, token) => {
  return apiFetch(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(data), token: token });
};

export const deleteReminder = (id, userId, token) => {
  return apiFetch(`/reminders/${id}?user_id=${userId}`, { method: 'DELETE', token: token });
};

// ==================== BUDGET API FUNCTIONS  ====================

export const fetchBudgets = (userId, token) => {
  return apiFetch(`/budgets?user_id=${userId}`, { token: token });
};

export const createBudget = (data, token) => {
  return apiFetch('/budgets', { method: 'POST', body: JSON.stringify(data), token: token });
};

export const updateBudget = (id, data, token) => {
  return apiFetch(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data), token: token });
};

export const deleteBudget = (id, token) => {
  return apiFetch(`/budgets/${id}`, { method: 'DELETE', token: token });
};

// ==================== GOAL API FUNCTIONS  ====================

export const fetchGoals = (userId, token) => {
  return apiFetch(`/goals?user_id=${userId}`, { token: token });
};

export const createGoal = (data, token) => {
  return apiFetch('/goals', { method: 'POST', body: JSON.stringify(data), token: token });
};

export const updateGoal = (id, data, token) => {
  return apiFetch(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data), token: token });
};

export const deleteGoal = (id, token) => {
  return apiFetch(`/goals/${id}`, { method: 'DELETE', token: token });
};

// ==================== REPORT API FUNCTIONS  ====================

export const fetchReports = (userId, token) => {
  return apiFetch(`/reports?user_id=${userId}`, { token: token });
};

export const createReport = (data, token) => {
  return apiFetch('/reports', { method: 'POST', body: JSON.stringify(data), token: token });
};

export const deleteReport = (id, token) => {
  return apiFetch(`/reports/${id}`, { method: 'DELETE', token: token });
};

// ==================== PREFERENCES API FUNCTIONS ====================

// Check if the application is running in mock mode
export const isMockMode = () => USE_MOCK;

// Fetch user preferences by user ID
export const fetchPreferences = (userId, token) => {
  return apiFetch(`/preferences/${userId}`, { token: token });
};

// Update user preferences
export const updatePreferences = (userId, data, token) => {
  return apiFetch(`/preferences/${userId}`, { method: 'PUT', body: JSON.stringify(data), token: token });
};

// Create user preferences (POST)
export const createPreferences = (data, token) => {
  return apiFetch('/preferences', { method: 'POST', body: JSON.stringify(data), token: token });
};