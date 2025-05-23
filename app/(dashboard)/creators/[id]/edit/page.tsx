// app/(dashboard)/creators/[id]/edit/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
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
import { apiClient } from '../../../../../lib/api';

// Creator interface
interface Creator {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Creator form validation schema
const editCreatorSchema = z.object({
  name: z.string().min(1, 'Creator name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').nullable(),
  is_active: z.boolean(),
});

// Form type from schema
type EditCreatorFormValues = z.infer<typeof editCreatorSchema>;

export default function EditCreatorPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const router = useRouter();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Form setup
  const { control, handleSubmit, watch, reset, formState: { errors, isDirty } } = useForm<EditCreatorFormValues>({
    resolver: zodResolver(editCreatorSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    }
  });

  // Watch name for avatar preview
  const watchedName = watch('name');

  // Fetch creator data
  useEffect(() => {
    const fetchCreator = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Fetching creator data for editing...');
        
        const creatorData = await apiClient.get<Creator>(`/creators/${resolvedParams.id}`);
        
        console.log('✅ Creator data fetched:', creatorData);
        
        setCreator(creatorData);
        setAvatarPreview(creatorData.avatar_url);
        
        // Update form with fetched data
        reset({
          name: creatorData.name,
          description: creatorData.description,
          is_active: creatorData.is_active,
        });
        
      } catch (err: any) {
        console.error('❌ Error fetching creator:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to load creator data');
      } finally {
        setLoading(false);
      }
    };

    if (resolvedParams.id) {
      fetchCreator();
    }
  }, [resolvedParams.id, reset]);

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
  const onSubmit = async (data: EditCreatorFormValues) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('💾 Updating creator:', data);
      
      // Update the creator data
      const updateData = {
        name: data.name,
        description: data.description || null,
        is_active: data.is_active,
      };

      const updatedCreator = await apiClient.patch(`/creators/${resolvedParams.id}`, updateData);
      
      // If there's an avatar file, upload it separately
      if (avatarFile) {
        try {
          const formData = new FormData();
          formData.append('avatar', avatarFile);
          
          // Upload avatar (you might need to create this endpoint)
          await apiClient.patch(`/creators/${resolvedParams.id}/avatar`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (avatarError) {
          console.warn('Avatar upload failed, but creator was updated:', avatarError);
        }
      }
      
      setSuccess('Creator updated successfully!');
      
      // Update local creator state
      setCreator(prev => prev ? { ...prev, ...updateData, updated_at: new Date().toISOString() } : null);
      
      // Reset form dirty state
      reset(data);
      setAvatarFile(null);
      
    } catch (err: any) {
      console.error('❌ Error updating creator:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to update creator');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel/back
  const handleCancel = () => {
    router.push(`/creators/${resolvedParams.id}`);
  };

  // Handle back to creator detail
  const handleBackToDetail = () => {
    router.push(`/creators/${resolvedParams.id}`);
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error && !creator) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/creators')}
          sx={{ mt: 2 }}
        >
          Back to Creators
        </Button>
      </Box>
    );
  }

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
        <MuiLink component={Link} href="/dashboard" color="inherit" underline="hover">
          Dashboard
        </MuiLink>
        <MuiLink component={Link} href="/creators" color="inherit" underline="hover">
          Creators
        </MuiLink>
        <MuiLink component={Link} href={`/creators/${resolvedParams.id}`} color="inherit" underline="hover">
          {creator?.name || 'Creator'}
        </MuiLink>
        <Typography color="text.primary">Edit</Typography>
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
            onClick={handleBackToDetail}
            sx={{ mr: 2, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.default' } }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h4" component="h1" fontWeight="bold" color="white">
            Edit Creator: {creator?.name}
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
                  {(watchedName || creator?.name || '?').charAt(0).toUpperCase()}
                </Avatar>
                
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  disabled={saving}
                >
                  {avatarFile ? 'Change Avatar' : 'Upload New Avatar'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </Button>
                
                {avatarFile && (
                  <Typography variant="body2" color="primary" sx={{ mt: 1, textAlign: 'center' }}>
                    New image selected
                  </Typography>
                )}
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Square images work best. Max size: 5MB
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
                    disabled={saving}
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
                    disabled={saving}
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
                        disabled={saving}
                      />
                    }
                    label="Active Creator"
                    sx={{ mt: 2 }}
                  />
                )}
              />
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Active creators can be used for generating suggestions.
              </Typography>
              
              {/* Creation and update info */}
              {creator && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Created:</strong> {new Date(creator.created_at).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Last Updated:</strong> {new Date(creator.updated_at).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
          
          {/* Action Buttons */}
          <Box sx={{ 
            mt: 4, 
            pt: 3, 
            borderTop: 1, 
            borderColor: 'divider',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2 
          }}>
            <Typography variant="body2" color="text.secondary">
              {isDirty || avatarFile ? 'You have unsaved changes' : 'No unsaved changes'}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={saving}
                size="large"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={saving || (!isDirty && !avatarFile)}
                size="large"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}