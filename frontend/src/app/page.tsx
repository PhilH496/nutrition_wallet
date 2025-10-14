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
    <Container size={420} my={40}>
      <Title ta="center" className="font-['Outfit',var(--mantine-font-family)] font-medium" >
        Welcome back!
      </Title>

      <Text className="text-[var(--mantine-color-dimmed)] text-sm text-center mt-[5px]">
        Do not have an account yet? <Anchor href='/create_account'> Create account </Anchor>
      </Text>

      <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
        <TextInput label="Email" placeholder="you@mantine.dev" required radius="md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordInput label="Password" placeholder="Your password" required mt="md" radius="md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Group justify="space-between" mt="lg">
          <Checkbox label="Remember me" />
          <Anchor component="button" size="sm">
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
        >
          Sign in
        </Button>
        {error && (
          <div>
            {error}
          </div>
        )}


      </Paper>
    </Container>
  );
}