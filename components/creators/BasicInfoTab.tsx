// components/creators/BasicInfoTab.tsx
'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  Divider,
  Button,
  TextField,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { format } from 'date-fns';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { apiClient } from '../../lib/api';

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

interface BasicInfoTabProps {
  creator: Creator;
  setCreator: React.Dispatch<React.SetStateAction<Creator | null>>;
  setSuccess: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function BasicInfoTab({ creator, setCreator, setSuccess, setError }: BasicInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: creator.name,
    description: creator.description || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(creator.avatar_url);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // In a real app, you would update via the API with FormData for file upload
      const formDataObj = new FormData();
      formDataObj.append('name', formData.name);
      formDataObj.append('description', formData.description);
      if (avatarFile) {
        formDataObj.append('avatar', avatarFile);
      }
      await apiClient.patch(`/creators/${creator.id}`, formDataObj, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // For now, just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update the creator state
      const updatedCreator = {
        ...creator,
        name: formData.name,
        description: formData.description,
        avatar_url: avatarPreview,
        updated_at: new Date().toISOString(),
      };
      
      setCreator(updatedCreator);
      setSuccess('Creator updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating creator:', err);
      setError(err.message || 'Failed to update creator');
    } finally {
      setSaving(false);
    }
  };

  // Format a date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Box>      
      {isEditing ? (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight="bold">Edit Basic Information</Typography>
            <Box>
              <IconButton 
                color="error" 
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: creator.name,
                    description: creator.description || '',
                  });
                  setAvatarPreview(creator.avatar_url);
                  setAvatarFile(null);
                }}
                disabled={saving}
              >
                <CancelIcon />
              </IconButton>
            </Box>
          </Box>
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Avatar upload */}
              <Grid size={{ xs: 12, sm: 4, md: 3 }} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: '3rem',
                    bgcolor: 'primary.main',
                    mb: 2,
                  }}
                >
                  {formData.name.charAt(0).toUpperCase()}
                </Avatar>
                
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  disabled={saving}
                >
                  Change Avatar
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </Button>
              </Grid>
              
              {/* Form fields */}
              <Grid size={{ xs: 12, sm: 8, md: 9 }}>
                <TextField
                  fullWidth
                  label="Creator Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  required
                  disabled={saving}
                />
                
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  margin="normal"
                  variant="outlined"
                  multiline
                  rows={4}
                  disabled={saving}
                  placeholder="Describe this creator's role and writing style"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </form>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Creator Info Card */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">Basic Information</Typography>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {/* Basic info */}
                <Grid size={{ xs: 12, sm: 4, md: 3 }} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Avatar
                    src={creator.avatar_url || undefined}
                    sx={{
                      width: 120,
                      height: 120,
                      fontSize: '3rem',
                      bgcolor: 'primary.main',
                    }}
                  >
                    {creator.name.charAt(0).toUpperCase()}
                  </Avatar>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 8, md: 9 }}>
                  <Typography variant="h5" gutterBottom>
                    {creator.name}
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    {creator.description || 'No description provided.'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    <strong>Status:</strong> {creator.is_active ? 'Active' : 'Inactive'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Dates & Stats Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Details
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Creator ID:</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {creator.id}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Created:</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(creator.created_at)}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Last Updated:</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(creator.updated_at)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}