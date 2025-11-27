'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { FaCamera } from 'react-icons/fa'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[var(--light-green)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-3 text-[var(--dark-green)]">Dashboard</h1>
          <p className="text-[var(--dark-green)]">Welcome, {user.email}!</p>
        </div>

        <div className="flex flex-col w-full border-t-2 border-b-2 border-[var(--dark-green)] divide-y-2 divide-[var(--dark-green)] overflow-hidden">
          <button
            onClick={() => router.push('/dashboard/scan')}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[var(--light-green)] text-[var(--dark-green)] font-medium transition border-0 first:rounded-t-xl hover:bg-white"
          >
            <FaCamera />
            Scan Nutrition Label
          </button>

          <button
            onClick={() => router.push('/dashboard/history')}
            className="w-full px-6 py-4 bg-[var(--light-green)] text-[var(--dark-green)] font-medium transition border-0 hover:bg-white"
          >
            History
          </button>

          <button
            onClick={handleSignOut}
            className="w-full px-6 py-4 bg-[var(--light-green)] text-[var(--dark-green)] font-medium transition border-0 last:rounded-b-xl hover:bg-white"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}