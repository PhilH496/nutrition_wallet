'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AuthContextType = {
  user: User | null
  loading: boolean 
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) 

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      
      if (session?.access_token) {
        localStorage.setItem('token', session.access_token)
        console.log('Session loaded for:', session.user?.email)
      } else {
        localStorage.removeItem('token')
      }
      
      setLoading(false) 
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, session?.user?.email)
      
      setUser(session?.user ?? null)
      
      if (session?.access_token) {
        localStorage.setItem('token', session.access_token)
        console.log('Token updated for:', session.user?.email)
      } else {
        localStorage.removeItem('token')
        console.log('Token cleared')
      }
      
      setLoading(false) 
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, username: string) => {
    // Clear any existing auth state FIRST
    console.log('Clearing old auth state before signup...')
    localStorage.removeItem('token')
    await supabase.auth.signOut()
    
    // delay to ensure clean state
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Signup failed')
    }
    
    console.log('Signup successful, signing in...')
    
    // Sign in with new account
    await signIn(email, password)
  }

  const signIn = async (email: string, password: string) => {
    // Clear old token first
    localStorage.removeItem('token')
    console.log('Signing in...')
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    
    // Store the new token
    if (data.session?.access_token) {
      localStorage.setItem('token', data.session.access_token)
      console.log('Token saved for:', data.user?.email)
    }
  }

  const signOut = async () => {
    console.log('Signing out...')
    
    // Clear token first
    localStorage.removeItem('token')
    setUser(null)
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    console.log('Signed out successfully')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}