'use client'

import { Button, Container, Loader, Paper, Text, Title } from '@mantine/core'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (!data.session) {
          throw new Error('Could not verify your session')
        }

        router.replace('/dashboard/scan')
      } catch (err: any) {
        setError(err.message ?? 'Unable to complete Google sign-in. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--light-green)]">
      <Container size={420}>
        <Paper withBorder shadow="sm" p={22} radius="md" className="bg-[var(--foreground)] border-[var(--dark-green)]">
          <Title ta="center" className="gfs-neohellenic-bold text-[var(--text-black)]">
            Finalizing sign in
          </Title>
          <Text ta="center" className="gfs-neohellenic-regular text-[var(--text-black)] mt-2">
            We are validating your Google credentials and will redirect you shortly.
          </Text>
          {loading && !error && (
            <div className="mt-6 flex justify-center">
              <Loader color="var(--dark-green)" size="sm" />
            </div>
          )}
          {error && (
            <div className="mt-6 space-y-3">
              <Text className="text-red-700 text-center">{error}</Text>
              <Button
                fullWidth
                radius="md"
                onClick={() => router.replace('/')}
                styles={{
                  root: { backgroundColor: 'var(--light-green)', color: 'var(--text-black)', borderColor: 'var(--dark-green)' },
                  label: { fontFamily: 'GFS Neohellenic, sans-serif', fontWeight: 700 },
                }}
              >
                Return to sign in
              </Button>
            </div>
          )}
        </Paper>
      </Container>
    </div>
  )
}

