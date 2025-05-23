// app/(dashboard)/creators/page.tsx - Updated to use real API data
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
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import FilterListIcon from '@mui/icons-material/FilterList';
import { apiClient } from '../../../lib/api';
import { format } from 'date-fns';

// Creator type definition from your backend
interface Creator {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// API response type for paginated creators
interface CreatorsResponse {
  items: Creator[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Stats for each creator (this would come from additional API calls or be included in the response)
interface CreatorStats {
  style_examples_count: number;
  response_examples_count: number;
  total_requests?: number;
}

export default function CreatorsPage() {
  const router = useRouter();
  
  // State management
  const [creators, setCreators] = useState<Creator[]>([]);
  const [creatorStats, setCreatorStats] = useState<Record<number, CreatorStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCreators, setTotalCreators] = useState(0);
  const itemsPerPage = 12;

  // Fetch creators from API
  const fetchCreators = async (currentPage: number = 1, search: string = '', status: string = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching creators from API...');
      
      // Build query parameters
      const params: any = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
      };
      
      // Add search if provided
      if (search.trim()) {
        params.search = search.trim();
      }
      
      // Add status filter if not 'all'
      if (status !== 'all') {
        params.is_active = status === 'active';
      }
      
      console.log('📤 API request params:', params);
      
      // Fetch creators from your API
      const response = await apiClient.get<CreatorsResponse>('/creators', { params });
      
      console.log('✅ Creators fetched successfully:', response);
      
      // Update state with real data
      setCreators(response.items || []);
      setTotalCreators(response.total || 0);
      setTotalPages(response.pages || 1);
      
      // Fetch stats for each creator (optional - you might want to include this in the main API response)
      await fetchCreatorStats(response.items || []);
      
    } catch (err: any) {
      console.error('❌ Error fetching creators:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load creators');
      // Set empty state on error
      setCreators([]);
      setTotalCreators(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Fetch additional stats for creators (if you have a stats endpoint)
  const fetchCreatorStats = async (creatorsList: Creator[]) => {
    try {
      const statsPromises = creatorsList.map(async (creator) => {
        try {
          // You can implement a stats endpoint like /creators/{id}/stats
          // For now, we'll fetch style examples count as an example
          const styleExamples = await apiClient.get(`/creators/${creator.id}/style-examples`, {
            params: { limit: 1 }
          });
          
          return {
            creatorId: creator.id,
            stats: {
              style_examples_count: styleExamples.total || 0,
              response_examples_count: 0, // You can fetch this similarly
              total_requests: 0, // This would come from analytics
            }
          };
        } catch (err) {
          console.warn(`Failed to fetch stats for creator ${creator.id}:`, err);
          return {
            creatorId: creator.id,
            stats: {
              style_examples_count: 0,
              response_examples_count: 0,
              total_requests: 0,
            }
          };
        }
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<number, CreatorStats> = {};
      
      statsResults.forEach(({ creatorId, stats }) => {
        statsMap[creatorId] = stats;
      });
      
      setCreatorStats(statsMap);
    } catch (err) {
      console.warn('Failed to fetch creator stats:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCreators(page, searchQuery, statusFilter);
  }, [page]); // Only re-fetch when page changes

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 1) {
        fetchCreators(1, searchQuery, statusFilter);
      } else {
        setPage(1); // This will trigger the effect above
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter]);

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
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
      setLoading(true);
      console.log('🗑️ Deleting creator:', selectedCreator.id);
      
      await apiClient.delete(`/creators/${selectedCreator.id}`);
      
      setSuccess(`Creator "${selectedCreator.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setSelectedCreator(null);
      
      // Refresh the list
      await fetchCreators(page, searchQuery, statusFilter);
      
    } catch (err: any) {
      console.error('❌ Error deleting creator:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to delete creator');
    } finally {
      setLoading(false);
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

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Filter creators locally (for real-time filtering feedback)
  const filteredCreators = creators.filter((creator) => {
    const matchesSearch = searchQuery === '' || 
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (creator.description && creator.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && creator.is_active) ||
      (statusFilter === 'inactive' && !creator.is_active);
    
    return matchesSearch && matchesStatus;
  });

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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Creators
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your creator profiles and messaging styles
            {totalCreators > 0 && (
              <Typography component="span" sx={{ ml: 1, fontWeight: 500 }}>
                ({totalCreators} total)
              </Typography>
            )}
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

      {/* Search and filter bar */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          placeholder="Search creators by name or description..."
          variant="outlined"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1, minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            label="Status"
            onChange={handleStatusFilterChange}
            startAdornment={<FilterListIcon sx={{ mr: 1 }} />}
          >
            <MenuItem value="all">All Creators</MenuItem>
            <MenuItem value="active">Active Only</MenuItem>
            <MenuItem value="inactive">Inactive Only</MenuItem>
          </Select>
        </FormControl>
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
            {searchQuery || statusFilter !== 'all' ? 'No creators found' : 'No creators yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {searchQuery || statusFilter !== 'all'
              ? `No creators match your current filters`
              : "You haven't created any creators yet"
            }
          </Typography>
          {!searchQuery && statusFilter === 'all' && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleAddClick}
            >
              Create Your First Creator
            </Button>
          )}
        </Box>
      ) : (
        <>
          {/* Creators grid */}
          <Grid container spacing={3}>
            {filteredCreators.map((creator) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={creator.id}>
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
                    
                    {/* Stats chips */}
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: 1, 
                        mt: 2,
                        flexWrap: 'wrap', 
                      }}
                    >
                      <Chip
                        size="small"
                        label={`${creatorStats[creator.id]?.style_examples_count || 0} Examples`}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={`${creatorStats[creator.id]?.response_examples_count || 0} Responses`}
                        variant="outlined"
                      />
                    </Box>
                    
                    {/* Created date */}
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      align="center" 
                      sx={{ display: 'block', mt: 2 }}
                    >
                      Created {formatDate(creator.created_at)}
                    </Typography>
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
                size="large"
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
            Are you sure you want to delete <strong>{selectedCreator?.name}</strong>? This action cannot be undone,
            and all associated examples, style configurations, and data will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}