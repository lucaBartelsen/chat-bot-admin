// app/(dashboard)/creators/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  TextField, 
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  CircularProgress,
  Fab,
  Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import { apiClient } from '../../../lib/api';

// Creator type definition
interface Creator {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  example_count?: {
    style: number;
    response: number;
  };
}

export default function CreatorsPage() {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  // Example mock data - replace with actual API call
  const mockCreators: Creator[] = [
    {
      id: 1,
      name: 'John Smith',
      description: 'Fashion blogger with a casual, friendly style.',
      avatar_url: null,
      is_active: true,
      created_at: '2025-01-15T12:00:00Z',
      updated_at: '2025-05-10T16:30:00Z',
      example_count: { style: 45, response: 22 }
    },
    {
      id: 2,
      name: 'Emily Johnson',
      description: 'Fitness influencer with motivational messaging.',
      avatar_url: null,
      is_active: true,
      created_at: '2025-02-20T14:20:00Z',
      updated_at: '2025-05-12T09:15:00Z',
      example_count: { style: 38, response: 18 }
    },
    {
      id: 3,
      name: 'Michael Wong',
      description: 'Tech reviewer with detailed technical explanations.',
      avatar_url: null,
      is_active: false,
      created_at: '2025-03-05T10:45:00Z',
      updated_at: '2025-04-28T17:00:00Z',
      example_count: { style: 52, response: 31 }
    },
    {
      id: 4,
      name: 'Sarah Davis',
      description: 'Food blogger with warm, inviting tone.',
      avatar_url: null,
      is_active: true,
      created_at: '2025-01-30T08:30:00Z',
      updated_at: '2025-05-18T11:20:00Z',
      example_count: { style: 67, response: 29 }
    },
    // Add more mock creators as needed
  ];

  // Fetch creators from API
  useEffect(() => {
    const fetchCreators = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch from the API
        const response = await apiClient.get('/creators', {
          params: { skip: (page - 1) * itemsPerPage, limit: itemsPerPage }
        });
        setCreators(response.data);
        setTotalPages(Math.ceil(response.total / itemsPerPage));
        
        // Using mock data for now
        setCreators(mockCreators);
        setTotalPages(Math.ceil(mockCreators.length / itemsPerPage));
      } catch (error) {
        console.error('Error fetching creators:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, [page]);

  // Filter creators based on search query
  const filteredCreators = creators.filter((creator) =>
    creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (creator.description && creator.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Handle delete button click
  const handleDeleteClick = (creator: Creator) => {
    setSelectedCreator(creator);
    setDeleteDialogOpen(true);
  };

  // Handle actual delete
  const handleDeleteConfirm = async () => {
    if (!selectedCreator) return;
    
    try {
      // In a real app, you would delete from the API
      await apiClient.delete(`/creators/${selectedCreator.id}`);
      
      // Update local state
      setCreators(creators.filter(c => c.id !== selectedCreator.id));
      setDeleteDialogOpen(false);
      setSelectedCreator(null);
    } catch (error) {
      console.error('Error deleting creator:', error);
    }
  };

  // Handle view button click
  const handleViewClick = (creatorId: number) => {
    router.push(`/creators/${creatorId}`);
  };

  // Handle edit button click
  const handleEditClick = (creatorId: number) => {
    router.push(`/creators/${creatorId}/edit`);
  };

  // Handle add new creator click
  const handleAddClick = () => {
    router.push('/creators/new');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Creators
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your creator profiles and messaging styles
          </Typography>
        </Box>
        <Fab
          color="primary"
          aria-label="add creator"
          onClick={handleAddClick}
          sx={{ boxShadow: 2 }}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Search bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search creators..."
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      ) : filteredCreators.length === 0 ? (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: 400, 
            textAlign: 'center',
            bgcolor: 'background.paper',
            p: 4,
            borderRadius: 2,
          }}
        >
          <GroupsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No creators found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {searchQuery 
              ? `No creators matching "${searchQuery}"`
              : "You haven't created any creators yet"
            }
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleAddClick}
          >
            Create Creator
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredCreators.map((creator) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={creator.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: 2,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                    position: 'relative',
                    overflow: 'visible',
                  }}
                >
                  {/* Status indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      zIndex: 1,
                    }}
                  >
                    <Chip
                      size="small"
                      label={creator.is_active ? 'Active' : 'Inactive'}
                      color={creator.is_active ? 'success' : 'default'}
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                    {/* Avatar */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Avatar
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          bgcolor: 'primary.main',
                          fontSize: '2rem',
                        }}
                        src={creator.avatar_url || undefined}
                      >
                        {creator.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </Box>
                    
                    {/* Creator name */}
                    <Typography variant="h6" component="h2" align="center" gutterBottom>
                      {creator.name}
                    </Typography>
                    
                    {/* Description */}
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      align="center"
                      sx={{
                        height: 60,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {creator.description || 'No description provided.'}
                    </Typography>
                    
                    {/* Example counts */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: 2, 
                        mt: 2,
                        flexWrap: 'wrap', 
                      }}
                    >
                      <Chip
                        size="small"
                        label={`${creator.example_count?.style || 0} Style Examples`}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={`${creator.example_count?.response || 0} Response Examples`}
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                    <Box>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteClick(creator)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditClick(creator.id)}
                          sx={{ ml: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewClick(creator.id)}
                    >
                      View
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Creator</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedCreator?.name}? This action cannot be undone,
            and all associated examples and data will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}