// app/(dashboard)/creators/page.tsx - Complete updated version with fixed response counts
'use client';

import { useState, useEffect, useRef } from 'react';
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
import RefreshIcon from '@mui/icons-material/Refresh';
import GetAppIcon from '@mui/icons-material/GetApp';
import SettingsIcon from '@mui/icons-material/Settings';
import { apiClient, creatorsApi, type Creator, type CreatorsResponse, type BulkCreatorStats, CreatorStats } from '../../../lib/api';
import { format } from 'date-fns';

export default function CreatorsPage() {
  const router = useRouter();
  
  // State management
  const [creators, setCreators] = useState<Creator[]>([]);
  const [creatorStats, setCreatorStats] = useState<Record<number, CreatorStats>>({});
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
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

  // Add refs to track state and prevent unnecessary calls
  const isInitialMount = useRef(true);
  const searchTimeoutRef = useRef<number | null>(null);
  const lastFetchParams = useRef<{page: number, search: string, status: string} | null>(null);

  // Enhanced fetchCreators function with duplicate call prevention
  const fetchCreators = async (currentPage: number = 1, search: string = '', status: string = 'all') => {
    // Prevent duplicate calls with same parameters
    const currentParams = {page: currentPage, search, status};
    if (lastFetchParams.current && 
        lastFetchParams.current.page === currentParams.page &&
        lastFetchParams.current.search === currentParams.search &&
        lastFetchParams.current.status === currentParams.status) {
      console.log('🚫 Skipping duplicate API call with same parameters');
      return;
    }
    
    lastFetchParams.current = currentParams;
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching creators from API...');
      
      const params: any = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
      };
      
      if (search.trim()) {
        params.search = search.trim();
      }
      
      if (status !== 'all') {
        params.is_active = status === 'active';
      }
      
      console.log('📤 API request params:', params);
      
      const response = await creatorsApi.getCreators(params);
      console.log('✅ Creators fetched successfully:', response);
      
      setCreators(response.items || []);
      setTotalCreators(response.total || 0);
      setTotalPages(response.pages || 1);
      
      if (response.items && response.items.length > 0) {
        await fetchCreatorStats(response.items);
      }
      
    } catch (err: any) {
      console.error('❌ Error fetching creators:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load creators');
      setCreators([]);
      setTotalCreators(0);
      setTotalPages(1);
      setCreatorStats({});
    } finally {
      setLoading(false);
    }
  };

  // Effect for initial load only
  useEffect(() => {
    if (isInitialMount.current) {
      console.log('🚀 Initial mount - fetching creators');
      fetchCreators(page, searchQuery, statusFilter);
      isInitialMount.current = false;
    }
  }, []); // Empty dependency array - runs only on mount

  // Effect for page changes (immediate)
  useEffect(() => {
    if (!isInitialMount.current) {
      console.log('📄 Page changed - fetching creators');
      fetchCreators(page, searchQuery, statusFilter);
    }
  }, [page]); // Only page changes

  // Effect for search/filter changes (debounced)
  useEffect(() => {
    if (!isInitialMount.current) {
      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search/filter changes
      searchTimeoutRef.current = window.setTimeout(() => {
        console.log('🔍 Search/filter changed - fetching creators after debounce');
        // Reset to page 1 when searching/filtering
        if (page !== 1) {
          setPage(1); // This will trigger the page effect
        } else {
          fetchCreators(1, searchQuery, statusFilter);
        }
      }, 500);

      // Cleanup function
      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
          searchTimeoutRef.current = null;
        }
      };
    }
  }, [searchQuery, statusFilter]); // Only search and filter changes

  // Enhanced fetchCreatorStats function (same as before)
  const fetchCreatorStats = async (creatorsList: Creator[]) => {
    if (!creatorsList || creatorsList.length === 0) {
      setCreatorStats({});
      return;
    }

    setStatsLoading(true);
    
    try {
      console.log('📊 Fetching creator statistics...');
      
      const creatorIds = creatorsList.map(c => c.id);
      console.log('📊 Fetching stats for creators:', creatorIds);
      
      try {
        const bulkStats = await creatorsApi.getBulkCreatorStats(creatorIds);
        console.log('✅ Bulk stats received:', bulkStats);
        
        const statsMap: Record<number, CreatorStats> = {};
        
        Object.entries(bulkStats).forEach(([creatorId, stats]: [string, any]) => {
          const id = parseInt(creatorId);
          const creator = creatorsList.find(c => c.id === id);
          statsMap[id] = {
            creator_id: id,
            creator_name: stats.creator_name || creator?.name || '',
            creator_active: stats.creator_active ?? creator?.is_active ?? false,
            creator_description: stats.creator_description || creator?.description || null,
            style_examples_count: stats.style_examples_count || 0,
            response_examples_count: stats.response_examples_count || 0,
            total_individual_responses: stats.total_individual_responses || 0,
            total_examples: stats.total_examples || (stats.style_examples_count + stats.response_examples_count),
            conversation_count: stats.conversation_count || 0,
            total_requests: stats.total_requests || 0,
            style_examples_by_category: stats.style_examples_by_category || {},
            response_examples_by_category: stats.response_examples_by_category || {},
            recent_examples: stats.recent_examples || [],
            has_style_config: stats.has_style_config || false,
            created_at: stats.created_at || creator?.created_at || '',
            updated_at: stats.updated_at || creator?.updated_at || '',
            stats_generated_at: stats.stats_generated_at || new Date().toISOString(),
          };
        });
        
        console.log('✅ Creator stats processed:', statsMap);
        setCreatorStats(statsMap);
        return;
        
      } catch (bulkError: any) {
        console.warn('⚠️ Bulk stats endpoint failed, setting empty stats...', bulkError);
        
        const emptyStatsMap: Record<number, CreatorStats> = {};
        creatorsList.forEach(creator => {
          emptyStatsMap[creator.id] = {
            creator_id: creator.id,
            creator_name: creator.name,
            creator_active: creator.is_active,
            creator_description: creator.description,
            style_examples_count: 0,
            response_examples_count: 0,
            total_individual_responses: 0,
            total_examples: 0,
            conversation_count: 0,
            total_requests: 0, // ADDED: Include total_requests
            style_examples_by_category: {},
            response_examples_by_category: {},
            recent_examples: [],
            has_style_config: false,
            created_at: creator.created_at,
            updated_at: creator.updated_at,
            stats_generated_at: new Date().toISOString(),
          };
        });
        setCreatorStats(emptyStatsMap);
      }
      
    } catch (err) {
      console.error('❌ Failed to fetch creator stats:', err);
      const emptyStatsMap: Record<number, CreatorStats> = {};
      creatorsList.forEach(creator => {
        emptyStatsMap[creator.id] = {
          creator_id: creator.id,
          creator_name: creator.name,
          creator_active: creator.is_active,
          creator_description: creator.description,
          style_examples_count: 0,
          response_examples_count: 0,
          total_individual_responses: 0,
          total_examples: 0,
          conversation_count: 0,
          total_requests: 0, // ADDED: Include total_requests
          style_examples_by_category: {},
          response_examples_by_category: {},
          recent_examples: [],
          has_style_config: false,
          created_at: creator.created_at,
          updated_at: creator.updated_at,
          stats_generated_at: new Date().toISOString(),
        };
      });
      setCreatorStats(emptyStatsMap);
    } finally {
      setStatsLoading(false);
    }
  };

  // Handle search input change - FIXED: No immediate API call
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    // The useEffect will handle the API call with debouncing
  };

  // Handle status filter change - FIXED: No immediate API call
  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    // The useEffect will handle the API call
  };

  // Handle page change - FIXED: Reset to page 1 if searching/filtering
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // The useEffect will handle the API call
  };

  // Rest of your component methods remain the same...
  const handleDeleteClick = (creator: Creator) => {
    setSelectedCreator(creator);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCreator) return;
    
    try {
      setLoading(true);
      console.log('🗑️ Deleting creator:', selectedCreator.id);
      
      await creatorsApi.deleteCreator(selectedCreator.id);
      
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

  const handleViewClick = (creatorId: number) => {
    router.push(`/creators/${creatorId}`);
  };

  const handleEditClick = (creatorId: number) => {
    router.push(`/creators/${creatorId}/edit`);
  };

  const handleAddClick = () => {
    router.push('/creators/new');
  };

  const handleRefreshStats = async () => {
    if (creators.length > 0) {
      await fetchCreatorStats(creators);
    }
  };

  const handleExportCreators = async () => {
    try {
      const headers = ['ID', 'Name', 'Description', 'Status', 'Style Examples', 'Response Examples', 'Total Examples', 'Has Config', 'Created', 'Updated'];
      const rows = creators.map(creator => {
        const stats = creatorStats[creator.id];
        return [
          creator.id.toString(),
          `"${creator.name.replace(/"/g, '""')}"`,
          `"${(creator.description || '').replace(/"/g, '""')}"`,
          creator.is_active ? 'Active' : 'Inactive',
          stats?.style_examples_count?.toString() || '0',
          stats?.response_examples_count?.toString() || '0',
          stats?.total_examples?.toString() || '0',
          stats?.has_style_config ? 'Yes' : 'No',
          formatDate(creator.created_at),
          formatDate(creator.updated_at)
        ];
      });
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `creators_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('Creators exported successfully');
    } catch (err: any) {
      console.error('❌ Error exporting creators:', err);
      setError(err.message || 'Failed to export creators');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

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

      {/* Error message with retry functionality */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }} 
          onClose={() => setError(null)}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => fetchCreators(page, searchQuery, statusFilter)}
              disabled={loading}
            >
              Retry
            </Button>
          }
        >
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

        <Button
          variant="outlined"
          startIcon={<GetAppIcon />}
          onClick={handleExportCreators}
          disabled={creators.length === 0}
        >
          Export
        </Button>

        <Button
          variant="outlined"
          startIcon={statsLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={handleRefreshStats}
          disabled={statsLoading || creators.length === 0}
          sx={{ minWidth: 120 }}
        >
          {statsLoading ? 'Loading...' : 'Refresh Stats'}
        </Button>
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
                    
                    {/* Enhanced Stats chips with tooltips and better display */}
                    {statsLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <CircularProgress size={16} />
                      </Box>
                    ) : (
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          gap: 1, 
                          mt: 2,
                          flexWrap: 'wrap', 
                        }}
                      >
                        <Tooltip title="Style Examples - Training examples for writing style">
                          <Chip
                            size="small"
                            label={`${creatorStats[creator.id]?.style_examples_count || 0} Style`}
                            variant="outlined"
                            color="primary"
                            sx={{ fontWeight: 500 }}
                          />
                        </Tooltip>
                        
                        <Tooltip title="Response Examples - Multiple response options for similar messages">
                          <Chip
                            size="small"
                            label={`${creatorStats[creator.id]?.response_examples_count || 0} Response`}
                            variant="outlined"
                            color="secondary"
                            sx={{ fontWeight: 500 }}
                          />
                        </Tooltip>
                        
                        {/* Show total if there are examples */}
                        {(creatorStats[creator.id]?.total_examples || 0) > 0 && (
                          <Tooltip title="Total Examples">
                            <Chip
                              size="small"
                              label={`${creatorStats[creator.id]?.total_examples} Total`}
                              variant="filled"
                              color="default"
                              sx={{ fontWeight: 500, opacity: 0.8 }}
                            />
                          </Tooltip>
                        )}
                        
                        {/* Show style config indicator */}
                        {creatorStats[creator.id]?.has_style_config && (
                          <Tooltip title="Has Style Configuration">
                            <Chip
                              size="small"
                              label="Configured"
                              variant="filled"
                              color="success"
                              icon={<SettingsIcon />}
                              sx={{ fontWeight: 500 }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    )}
                    
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