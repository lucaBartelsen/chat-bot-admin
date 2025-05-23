// app/(dashboard)/creators/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  Avatar, 
  FormControlLabel,
  Switch,
  Breadcrumbs,
  Link as MuiLink,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import Link from 'next/link';
import { apiClient } from '../../../../lib/api';

// Creator form validation schema
const createCreatorSchema = z.object({
  name: z.string().min(1, 'Creator name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').nullable(),
  is_active: z.boolean(),
});

// Form type from schema
type CreateCreatorFormValues = z.infer<typeof createCreatorSchema>;

export default function NewCreatorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Form setup
  const { control, handleSubmit, watch, formState: { errors } } = useForm<CreateCreatorFormValues>({
    resolver: zodResolver(createCreatorSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    }
  });

  // Watch name for avatar preview
  const watchedName = watch('name');

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const onSubmit = async (data: CreateCreatorFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create the creator data object
      const creatorData = {
        name: data.name,
        description: data.description || null,
        avatar_url: null, // Will be updated after avatar upload if needed
        is_active: data.is_active,
      };

      // Create the creator via POST request
      const newCreator = await apiClient.post('/creators/', creatorData);
      
      // If there's an avatar file, upload it separately
      if (avatarFile && newCreator.id) {
        try {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          
          // Upload avatar (you might need to create this endpoint)
          await apiClient.patch(`/creators/${newCreator.id}/avatar`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (avatarError) {
          console.warn('Avatar upload failed, but creator was created:', avatarError);
        }
      }
      
      setSuccess('Creator created successfully! Redirecting...');
      
      // Redirect to the creator detail page after a brief delay
      setTimeout(() => {
        router.push(`/creators/${newCreator.id}`);
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating creator:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create creator');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel/back
  const handleCancel = () => {
    router.push('/creators');
  };

  return (
    <Box>
      {/* Success message */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Breadcrumbs navigation */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/dashboard" passHref legacyBehavior>
          <MuiLink color="inherit" underline="hover">Dashboard</MuiLink>
        </Link>
        <Link href="/creators" passHref legacyBehavior>
          <MuiLink color="inherit" underline="hover">Creators</MuiLink>
        </Link>
        <Typography color="text.primary">New Creator</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: `linear-gradient(to right, #d2b3e2, #e6d7ef)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Back button */}
          <IconButton
            onClick={handleCancel}
            sx={{ mr: 2, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.default' } }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h4" component="h1" fontWeight="bold" color="white">
            Create New Creator
          </Typography>
        </Box>
      </Paper>

      {/* Form */}
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={4}>
            {/* Avatar Section */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Creator Avatar
                </Typography>
                
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{
                    width: 150,
                    height: 150,
                    fontSize: '4rem',
                    bgcolor: 'primary.main',
                    mb: 2,
                  }}
                >
                  {watchedName ? watchedName.charAt(0).toUpperCase() : '?'}
                </Avatar>
                
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  disabled={loading}
                >
                  Upload Avatar
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </Button>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Optional. Square images work best.
                </Typography>
              </Box>
            </Grid>
            
            {/* Form Fields */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Creator Name"
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    required
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    disabled={loading}
                    placeholder="Enter the creator's name"
                  />
                )}
              />
              
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={4}
                    margin="normal"
                    variant="outlined"
                    error={!!errors.description}
                    helperText={errors.description?.message || "Describe this creator's role, content type, and general writing style"}
                    disabled={loading}
                    placeholder="e.g., Fashion blogger with a casual, friendly style who focuses on sustainable fashion..."
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                )}
              />
              
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label="Active Creator"
                    sx={{ mt: 2 }}
                  />
                )}
              />
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Active creators can be used for generating suggestions. You can change this later.
              </Typography>
            </Grid>
          </Grid>
          
          {/* Action Buttons */}
          <Box sx={{ 
            mt: 4, 
            pt: 3, 
            borderTop: 1, 
            borderColor: 'divider',
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2 
          }}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
              size="large"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={loading}
              size="large"
            >
              {loading ? 'Creating...' : 'Create Creator'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}