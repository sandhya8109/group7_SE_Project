import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useFinance } from '../context/FinanceContext'
import { useTheme } from '../context/ThemeContext'
import { fetchPreferences, updatePreferences, createPreferences, isMockMode } from '../api/client' 

// Helper function to handle PUT/POST fallback for preferences
const savePreferencesApi = async (userId, token, data) => {
    try {
        // 1. Attempt PUT (Update)
        await updatePreferences(userId, data, token);
        return true;
    } catch (error) {
        // If the error message is "Preferences not found or no changes made" (404),
        // it means the record doesn't exist. Attempt to create it.
        if (error.message.includes('Preferences not found') || error.message.includes('404')) {
            console.warn("Preferences record not found. Attempting to create (POST).");
            // 2. Attempt POST (Create)
            await createPreferences({ ...data, user_id: userId }, token);
            return true;
        }
        throw error; // Re-throw other errors
    }
}

export default function Settings(){
  // Destructure user and token for API calls
  const { profile, updateProfile, user, token } = useAuth() 
  const { state, setState, currencyMap } = useFinance()
  const { theme, setDark, setLight, toggleTheme } = useTheme()
  
  // Set initial form state using profile for name/email
  const [form, setForm] = useState({ 
      name: profile?.name || '', 
      email: profile?.email || '', 
      avatar: profile?.avatar || '', 
      currency: state.currency 
  })
  const [status, setStatus] = useState('')
  const emptyForm = { name: '', email: '', avatar: '', currency: state.currency }

  useEffect(() => {
      if (profile) {
          setForm(f => ({ 
              ...f, 
              name: profile.name || '', 
              email: profile.email || '', 
              avatar: profile.avatar || '',
          }));
      }
  }, [profile]);


  useEffect(() => {
    if (!user || !user.user_id || !token) return;

    const loadPreferences = async () => {
        try {
            const fetchedPreferences = await fetchPreferences(user.user_id, token);
            
            // Update form currency
            setForm(f => ({ 
                ...f, 
                currency: fetchedPreferences.currency,
            }));
            
            // Sync theme state
            if (fetchedPreferences.theme === 'dark') {
                setDark();
            } else if (fetchedPreferences.theme === 'light') {
                setLight();
            }
            
            // Update local finance state currency (important for app-wide use)
            setState(s => ({ ...s, currency: fetchedPreferences.currency }));

        } catch (error) {
            // Log warning if preferences are missing (POST will fix on first save)
            console.warn("Preferences not found for user. Will create on save.", error);
        }
      };

      loadPreferences();
    }, [user, token, setDark, setLight, setState]);

  const onImageChange = async (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm(f => ({ ...f, avatar: reader.result }))
    reader.readAsDataURL(file)
  }

  // Helper for saving theme only, called by theme buttons
  const saveThemePreference = useCallback(async (newTheme) => {
      if (!user || !user.user_id || !token) return;
      try {
          await savePreferencesApi(user.user_id, token, { theme: newTheme });
      } catch (error) {
          console.error('Failed to save theme preference:', error);
      }
  }, [user, token]);

  // Make save async and update backend
  const save = async (e) => { 
    e.preventDefault()
    if (!user || !user.user_id || !token) {
        setStatus('Authentication required to save changes.');
        setTimeout(() => setStatus(''), 3000);
        return;
    }

    // 1. Save Profile (Mocked locally by useAuth, as explicit API was not provided)
    updateProfile({ name: form.name, email: form.email, avatar: form.avatar })
    
    // 2. Save Currency Preference to Backend
      try {
          await savePreferencesApi(user.user_id, token, { currency: form.currency });
          
          // 3. Update local state ONLY on successful API call
          setState(s => ({ ...s, currency: form.currency }))
          
          setStatus('Preferences updated successfully ✅')

      } catch (error) {
          console.error('Failed to save preferences:', error);
          setStatus('Error saving preferences ❌')
      } finally {
          setTimeout(() => setStatus(''), 3000)
      }
  }

  const reset = () => { if(confirm('Reset local demo data?')){ localStorage.removeItem('pfbms-state-v1'); location.reload() } }

  return (
    <div className="space-y-4">
      <form className="card space-y-4" onSubmit={save}>
        <div>
          <div className="text-lg font-semibold">Profile & Preferences</div>
          <p className="text-sm text-muted">Keep your profile information and currency preference up to date.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <div className="space-y-3">
            <div className="label">Profile Picture</div>
            <div className="flex flex-col items-center gap-3">
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar preview" className="w-32 h-32 rounded-full object-cover border border-slate-700/60" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-panel2 flex items-center justify-center text-3xl">👤</div>
              )}
              <label className="btn btn-ghost text-sm cursor-pointer">
                Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={e => onImageChange(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="label">Full Name</div>
              <input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Alex Doe" />
            </div>
            <div>
              <div className="label">Email</div>
              <input className="input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="you@email.com" />
            </div>
            <div>
              <div className="label">Currency</div>
              <select className="input" value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))}>
                {Object.entries(currencyMap).map(([code, meta]) => (
                  <option value={code} key={code}>{code} — {meta.label}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit">Save Changes</button>
            {status && <div className="text-xs text-green-400">{status}</div>}
          </div>
        </div>
      </form>
      
      <div className="card space-y-3">
        <div>
          <div className="text-lg font-semibold">Appearance</div>
          <p className="text-sm text-muted">Switch between dark and light themes to match your environment.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setDark(); savePreferences({ theme: 'dark' }); }} 
            className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`}
            aria-pressed={theme === 'dark'}
          >
            Dark mode
          </button>
          <button
            type="button"
            onClick={() => { setLight(); savePreferences({ theme: 'light' }); }} 
            className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-ghost'}`}
            aria-pressed={theme === 'light'}
          >
            Light mode
          </button>
          <button type="button" onClick={toggleTheme} className="btn btn-ghost text-sm">
            Toggle
          </button>
        </div>
        <div className="text-xs text-muted">Your choice is saved locally so the app re-opens in the same mode.</div>
      </div>
      
      {/* Conditional Rendering for Demo Reset Button */}
      {isMockMode() && (
        <div className="card">
          <div className="mb-2 font-semibold">Data</div>
          <button className="btn btn-ghost" onClick={reset}>Reset Demo Data</button>
        </div>
      )}
    </div>
  )
}