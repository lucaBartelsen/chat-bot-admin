// app/(dashboard)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from '../../contexts/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
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
          ChatsAssistant
        </Typography>
        <CircularProgress color="primary" />
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // Don't render dashboard if no user
  if (!user) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}