import { apiFetch } from './client'

export async function loginApi({ email, password }){
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}
export async function signupApi({ email, password }){
  return apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) })
}
export async function meApi(token){
  return apiFetch('/auth/me', { method: 'GET', token })
}
