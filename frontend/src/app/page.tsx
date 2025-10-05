'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signUp, signIn, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Frontend validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    if (isSignUp && username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }
    
    setIsLoading(true)
    
    try {
      if (isSignUp) {
        await signUp(email, password, username)
      } else {
        await signIn(email, password)
      }
      router.push('/dashboard')
    } catch (err: any) {
      // Parse error messages
      let errorMessage = 'Authentication failed'
      
      if (err.message?.includes('duplicate key')) {
        errorMessage = 'Username or email already exists'
      } else if (err.message?.includes('already exists')) {
        errorMessage = err.message
      } else if (err.message?.includes('already taken')) {
        errorMessage = err.message
      } else if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password'
      } else if (err.message?.includes('Invalid email')) {
        errorMessage = 'Invalid email or password'
      } else if (err.message?.includes('Password')) {
        errorMessage = err.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
              disabled={isLoading}
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                required
                disabled={isLoading}
                minLength={3}
                maxLength={20}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
          >
            {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          disabled={isLoading}
          className="w-full text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  )
}