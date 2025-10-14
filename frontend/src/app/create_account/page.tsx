'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Anchor, Button, Container, Group, Paper, PasswordInput, TextInput, Title, } from '@mantine/core';

export default function CreateAccountPage() {
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [error, setError] = useState('')
    const { signUp, user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (user) {
            router.push('/dashboard')
        }
    }, [user, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        try {
            await signUp(email, password, username)
        } catch (err: any) {
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
        }
    }

    return (
        <Container size={420} my={40}>
            <Title ta="center" className="font-['Outfit',var(--mantine-font-family)] font-medium">
                Create Account
            </Title>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
                    <TextInput
                        label="Enter Email"
                        placeholder="you@epicreddit.com"
                        required radius="md"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        minLength={3}
                        maxLength={20}
                    />
                    <TextInput
                        label="Enter Username"
                        placeholder="awsomesauce123"
                        radius="md"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        maxLength={20}
                    />
                    <PasswordInput
                        label="Create Password"
                        placeholder="Your password"
                        required mt="md"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={3}
                        maxLength={30}
                    />
                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                            {error}
                        </div>
                    )}
                    <Button
                        type='submit'
                        fullWidth mt="xl"
                        radius="md"
                        onClick={() => setIsSignUp(!isSignUp)}
                    >
                        Create Account
                    </Button>
                    <Group justify="center" mt="md">
                        <Anchor href="./">Already have an account? Sign in</Anchor>
                    </Group>
                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                            {error}
                        </div>
                    )}
                </Paper>
            </form>


        </Container>
    )

}