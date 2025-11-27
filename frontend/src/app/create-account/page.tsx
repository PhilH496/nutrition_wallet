'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Anchor, Button, Container, Paper, PasswordInput, Text, TextInput, Title, } from '@mantine/core';

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
            router.push('/dashboard/scan')
        }
    }, [user, router])

    const handleSubmit = async (e: FormEvent) => {
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
        <div style={{ backgroundColor: 'var(--light-green)', minHeight: '100vh' }}>
            <canvas id="animated-canvas" className="fixed inset-0 z-0"></canvas>

            <Container
                size={420}
                my={40}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -70%)',
                    zIndex: 1,
                    width: '295.438px',
                }}
            >
                <Title ta="center" className="gfs-neohellenic-bold text-white">
                    Create Account
                </Title>

                <Text className="gfs-neohellenic-regular text-[var(--text-black)] mt-[5px] text-center">
                    Already have an account?{' '}
                    <Anchor href="/" className="text-[var(--text-black)] font-semibold">
                        Sign in
                    </Anchor>
                </Text>

                <form onSubmit={handleSubmit}>
                    <Paper
                        withBorder
                        shadow="sm"
                        p={22}
                        mt={30}
                        radius="md"
                        className="bg-[var(--light-green)] border-[var(--dark-green)]"
                        style={{ width: '263.438px' }}
                    >
                        <TextInput
                            label="Enter Email"
                            placeholder="you@example.com"
                            required
                            radius="md"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            minLength={3}
                            maxLength={20}
                            styles={{
                                input: { backgroundColor: 'var(--light-green)', color: 'text-white', borderColor: 'var(--dark-green)', fontFamily: 'GFS Neohellenic, sans-serif' },
                                label: { color: 'var(--text-black)', fontFamily: 'GFS Neohellenic, sans-serif' }
                              }}
                        />
                        <TextInput
                            label="Enter Username"
                            required
                            placeholder="awsomesauce123"
                            radius="md"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            maxLength={20}
                            styles={{
                                input: { backgroundColor: 'var(--light-green)', color: 'text-white', borderColor: 'var(--dark-green)', fontFamily: 'GFS Neohellenic, sans-serif' },
                                label: { color: 'var(--text-black)', fontFamily: 'GFS Neohellenic, sans-serif' }
                            }}
                        />
                        <PasswordInput
                            label="Create Password"
                            placeholder="Your password"
                            required
                            radius="md"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={3}
                            maxLength={30}
                            styles={{
                                input: { backgroundColor: 'var(--light-green)', color: 'text-white', borderColor: 'var(--dark-green)', fontFamily: 'GFS Neohellenic, sans-serif' },
                                label: { color: 'var(--text-black)', fontFamily: 'GFS Neohellenic, sans-serif' }
                            }}
                        />
                        {error && (
                            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3 mt-3">
                                {error}
                            </div>
                        )}
                        <Button
                            type="submit"
                            fullWidth
                            mt="lg"
                            radius="md"
                            onClick={() => setIsSignUp(!isSignUp)}
                            styles={{
                                root: {
                                    backgroundColor: 'var(--light-green)',
                                    color: 'var(--text-black)',
                                    borderColor: 'var(--dark-green)',
                                    borderWidth: 1,
                                },
                                label: {
                                    color: 'var(--text-black)',
                                    fontFamily: 'GFS Neohellenic, sans-serif',
                                    fontWeight: 700,
                                },
                            }}
                        >
                            Create Account
                        </Button>
                    </Paper>
                </form>
            </Container>

            <script src="/lines.js"></script>
        </div>
    )
}