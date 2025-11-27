'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type OAuthProvider = 'google'

type AuthContextType = {
  user: User | null
  loading: boolean 
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const API_URL = process.env.NEXT_PUBLIC_API_URL

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.access_token) {
          localStorage.setItem('token', session.access_token)
        } else {
          localStorage.removeItem('token')
        }
      } catch (error) {
      } finally {
        setLoading(false)
        setInitialCheckDone(true)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      
      setUser(session?.user ?? null)
      
      if (session?.access_token) {
        localStorage.setItem('token', session.access_token)
      } else {
        localStorage.removeItem('token')
      }
      
      if (initialCheckDone) {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [initialCheckDone])

  const signUp = async (email: string, password: string, username: string) => {
    // Clear any existing auth state FIRST
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
    
    
    // Sign in with new account
    await signIn(email, password)
  }

  const signIn = async (email: string, password: string) => {
    // Clear old token first
    localStorage.removeItem('token')
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    
    // Store the new token
    if (data.session?.access_token) {
      localStorage.setItem('token', data.session.access_token)
      setUser(data.user)
    }
  }

  const signInWithOAuth = async (provider: OAuthProvider) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : API_URL!
    const redirectTo = `${origin}/auth/callback`

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo }
    })

    if (error) throw error
  }

  const signOut = async () => {
    
    // Clear token first
    localStorage.removeItem('token')
    setUser(null)
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithOAuth, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}