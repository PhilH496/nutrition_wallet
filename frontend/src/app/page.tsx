'use client'

import { Anchor, Button, Checkbox, Container, Group, Paper, PasswordInput, Text, TextInput, Title, } from '@mantine/core';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const { signIn, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  return (
    <div style={{ backgroundColor: 'var(--light-green)', minHeight: '100vh' }}>
      <canvas id="animated-canvas" className="fixed inset-0 z-0"></canvas>

      <Container size={420} my={40} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -70%)', zIndex: 1 }}>
        <Title ta="center" className="gfs-neohellenic-bold text-white">
          Welcome back!
        </Title>

        <Text className="gfs-neohellenic-regular text-[var(--text-black)] mt-[5px]">
          Do not have an account yet? <Anchor href='/create_account'className='text-[var(--text-black)]'> Create account </Anchor>
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
              input: { backgroundColor: 'var(--light-green)', color: 'text-white', borderColor: 'var(--dark-green)', fontFamily: 'GFS Neohellenic, sans-serif' },
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
              input: { backgroundColor: 'var(--light-green)', color: 'text-white', borderColor: 'var(--dark-green)', fontFamily: 'GFS Neohellenic, sans-serif' },
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
            fullWidth mt="xl"
            radius="md"
            onClick={() => {
              try {
                (async () => {
                  await signIn(email, password)
                })()
              } catch (err: any) {
                setError(err.message)
              }
            }
            }
            styles={{
              root: { backgroundColor: 'var(--light-green)', color: 'var(--text-black)', borderColor: "var(--dark-green)" },
              label: { color: 'var(--text-black)', fontFamily: 'GFS Neohellenic, sans-serif', fontWeight: 700 }
            }}
          >
            Sign in
          </Button>
          {error && (
            <div style={{ color: 'text-white', backgroundColor: 'var(--text-black)', borderColor: 'var(--dark-green)', border: '1px solid #FCEE0A', fontFamily: 'GFS Neohellenic, sans-serif' }} className="text-sm rounded-md p-3 mt-3">
              {error}
            </div>
          )}
        </Paper>
      </Container>

      <script src="/lines.js"></script>
    </div>
  );
}