'use client'

import { Anchor, Button, Checkbox, Container, Group, Paper, PasswordInput, Text, TextInput, Title, } from '@mantine/core';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import Script from 'next/script'

export default function SignInPage() {
  const { signIn, signInWithOAuth, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard/scan')
    }
  }, [user, router])

  const handleEmailSignIn = async () => {
    setError('')
    setIsSubmitting(true)

    try {
      await signIn(email, password)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to sign in'
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      await signInWithOAuth('google')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to sign in with Google'
      setError(errorMessage)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--lighter-green)', minHeight: '100vh' }}>
      <canvas id="animated-canvas" className="fixed inset-0 z-0"></canvas>

      <Container size={420} my={40} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -70%)', zIndex: 1 }}>
        <Title ta="center" className="gfs-neohellenic-bold text-white">
          Nutrition Wallet
        </Title>

        <Text className="gfs-neohellenic-regular text-[var(--text-black)] mt-[5px]  text-center">
          Don&apos;t have an account yet? <br></br><Anchor href='/create-account' className='text-[var(--text-black)] font-semibold'> Create account </Anchor>
        </Text>

        <Paper
          withBorder
          shadow="sm"
          p={22}
          mt={30}
          radius="md"
          className="bg-[var(--light-green)] border-[var(--dark-green)]"
        >
          <TextInput
            label="Email"
            placeholder="you@asu.edu"
            required
            radius="md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            styles={{
              input: { backgroundColor: 'var(--foreground)', color: 'text-white', borderColor: 'var(--dark-green)', fontFamily: 'GFS Neohellenic, sans-serif' },
              label: { color: 'var(--text-black)', fontFamily: 'GFS Neohellenic, sans-serif' }
            }}
          />
          <PasswordInput
            label="Password"
            placeholder="your password"
            required
            mt="md"
            radius="md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            styles={{
              input: { backgroundColor: 'var(--foreground)', color: 'text-white', borderColor: 'var(--dark-green)', fontFamily: 'GFS Neohellenic, sans-serif' },
              label: { color: 'var(--text-black)', fontFamily: 'GFS Neohellenic, sans-serif' }
            }}
          />
          <Group justify="space-between" mt="lg">
            <Checkbox
              variant='outline'
              color='var(--dark-green)'
              iconColor='var(--dark-green)'
              label="Remember me"
              styles={{
                label: { color: 'var(--text-black)', fontFamily: 'GFS Neohellenic, sans-serif' }
              }}
            />
            <Anchor
              component="button"
              size="sm"
              style={{ color: 'var(--text-black)', fontFamily: 'GFS Neohellenic, sans-serif' }}
            >
              Forgot password?
            </Anchor>
          </Group>
          <Button
            fullWidth
            mt="xl"
            radius="md"
            loading={isSubmitting}
            onClick={handleEmailSignIn}
            styles={{
              root: { backgroundColor: 'var(--forest-green)', color: 'var(--text-black)', borderColor: "var(--dark-green)" },
              label: { color: 'var(--foreground)', fontFamily: 'GFS Neohellenic, sans-serif', fontWeight: 500 }
            }}
          >
            Sign in
          </Button>
          <Button
            fullWidth
            mt="sm"
            radius="md"
            loading={googleLoading}
            variant="default"
            onClick={handleGoogleSignIn}
            styles={{
              root: { backgroundColor: 'var(--forest-green)', color: 'var(--text-black)', borderColor: "var(--dark-green)" },
              label: { color: 'var(--foreground)', fontFamily: 'GFS Neohellenic, sans-serif', fontWeight: 500 }
            }}
          >
            <span className="flex w-full items-center justify-center gap-2">
              Sign in with Google
              <FcGoogle/>
            </span>
          </Button>
          {error && (
            <div style={{ color: 'text-white', backgroundColor: 'var(--text-black)', borderColor: 'var(--dark-green)', border: '1px solid #FCEE0A', fontFamily: 'GFS Neohellenic, sans-serif' }} className="text-sm rounded-md p-3 mt-3">
              {error}
            </div>
          )}
        </Paper>
      </Container>

      <Script src="/lines.js" strategy="lazyOnload" />
    </div>
  );
}