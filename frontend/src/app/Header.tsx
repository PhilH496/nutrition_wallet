'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Group, Text, UnstyledButton } from '@mantine/core';

export function HeaderMegaMenu() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Unable to sign out', error);
    } finally {
      router.push('/');
    }
  };

  return (
    <Box component="header" className="bg-[var(--light-green)] border-b border-[var(--dark-green)]">
      <Group className="max-w-6xl mx-auto px-6 py-3 justify-between">
        <UnstyledButton
          onClick={() => router.push('/dashboard/scan')}
          className="p-0 bg-transparent border-0 cursor-pointer"
        >
          <Text className="text-[var(--dark-green)] text-xl font-bold tracking-wide uppercase">
            Nutrition Wallet
          </Text>
        </UnstyledButton>

        <button
          className="bg-[var(--light-green)] border border-[var(--dark-green)] text-[var(--dark-green)] px-6 py-1 rounded-lg hover:bg-white"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </Group>
    </Box>
  );
}