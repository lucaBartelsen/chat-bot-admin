// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { isAuthenticated } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Short delay for a smoother transition
    const redirectTimer = setTimeout(() => {
      // Check if user is authenticated
      if (isAuthenticated()) {
        // Redirect to dashboard if authenticated
        router.push('/dashboard');
      } else {
        // Redirect to login if not authenticated
        router.push('/auth/login');
      }
    }, 500);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        gap: 2,
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
        FanFix ChatAssist
      </Typography>
      <CircularProgress color="primary" />
      <Typography variant="body1" color="text.secondary">
        Redirecting...
      </Typography>
    </Box>
  );
}