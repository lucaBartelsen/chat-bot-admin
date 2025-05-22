// components/creators/StyleExamplesTab.tsx - Updated implementation

'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  IconButton,
  TextField, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Chip,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  Fab,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  LinearProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { apiClient } from '../../lib/api';
import { format } from 'date-fns';

// Style example interface
interface StyleExample {
  id: number;
  creator_id: number;
  fan_message: string;
  creator_response: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

// API response type for style examples
interface StyleExamplesResponse {
  items: StyleExample[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Style example form validation schema
const styleExampleSchema = z.object({
  fan_message: z.string().min(1, 'Fan message is required'),
  creator_response: z.string().min(1, 'Creator response is required'),
  category: z.string().nullable(),
});

// Form type from schema
type StyleExampleFormValues = z.infer<typeof styleExampleSchema>;

// Props for style examples tab
interface StyleExamplesTabProps {
  creatorId: number;
}

// Example categories
const categories = [
  'Greeting',
  'Question',
  'Compliment',
  'Request',
  'Problem',
  'Feedback',
  'Flirty',
  'Casual',
  'Formal',
  'Other',
];

export default function StyleExamplesTab({ creatorId }: StyleExamplesTabProps) {
  const [examples, setExamples] = useState<StyleExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExample, setEditingExample] = useState<StyleExample | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExample, setSelectedExample] = useState<StyleExample | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalExamples, setTotalExamples] = useState(0);

  // Form for adding/editing examples
  const { control, handleSubmit, reset, formState: { errors } } = useForm<StyleExampleFormValues>({
    resolver: zodResolver(styleExampleSchema),
    defaultValues: {
      fan_message: '',
      creator_response: '',
      category: null,
    }
  });

  // Fetch examples from API
  useEffect(() => {
    const fetchExamples = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get<StyleExamplesResponse>(`/creators/${creatorId}/style-examples`, {
          params: {
            skip: page * rowsPerPage,
            limit: rowsPerPage,
            search: searchQuery || undefined,
            category: categoryFilter !== 'all' ? categoryFilter : undefined,
          }
        });
        
        setExamples(response.items);
        setTotalExamples(response.total);
      } catch (err: any) {
        console.error('Error fetching style examples:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to load style examples');
      } finally {
        setLoading(false);
      }
    };

    fetchExamples();
  }, [creatorId, page, rowsPerPage, searchQuery, categoryFilter]);

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(0); // Reset to first page when searching
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, categoryFilter]);

  // Open add example dialog
  const handleAddExample = () => {
    setEditingExample(null);
    reset({
      fan_message: '',
      creator_response: '',
      category: null,
    });
    setDialogOpen(true);
  };

  // Open edit example dialog
  const handleEditExample = (example: StyleExample) => {
    setEditingExample(example);
    reset({
      fan_message: example.fan_message,
      creator_response: example.creator_response,
      category: example.category,
    });
    setDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (example: StyleExample) => {
    setSelectedExample(example);
    setDeleteDialogOpen(true);
  };

  // Handle form submission for add/edit
  const onSubmit = async (data: StyleExampleFormValues) => {
    setError(null);
    
    try {
      if (editingExample) {
        // Update existing example
        await apiClient.patch(`/creators/${creatorId}/style-examples/${editingExample.id}`, data);
        setSuccess('Example updated successfully');
      } else {
        // Add new example
        await apiClient.post(`/creators/${creatorId}/style-examples`, data);
        setSuccess('Example added successfully');
      }
      
      setDialogOpen(false);
      // Refresh the list
      const response = await apiClient.get<StyleExamplesResponse>(`/creators/${creatorId}/style-examples`, {
        params: {
          skip: page * rowsPerPage,
          limit: rowsPerPage,
          search: searchQuery || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
        }
      });
      setExamples(response.items);
      setTotalExamples(response.total);
    } catch (err: any) {
      console.error('Error saving example:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to save example');
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedExample) return;
    
    try {
      await apiClient.delete(`/creators/${creatorId}/style-examples/${selectedExample.id}`);
      setSuccess('Example deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedExample(null);
      
      // Refresh the list
      const response = await apiClient.get<StyleExamplesResponse>(`/creators/${creatorId}/style-examples`, {
        params: {
          skip: page * rowsPerPage,
          limit: rowsPerPage,
          search: searchQuery || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
        }
      });
      setExamples(response.items);
      setTotalExamples(response.total);
    } catch (err: any) {
      console.error('Error deleting example:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to delete example');
    }
  };

  // Handle bulk upload dialog open
  const handleBulkUploadOpen = () => {
    setBulkUploadFile(null);
    setUploadProgress(0);
    setBulkUploadOpen(true);
  };

  // Handle file selection for bulk upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setBulkUploadFile(event.target.files[0]);
    }
  };

  // Handle bulk upload confirmation
  const handleBulkUploadConfirm = async () => {
    if (!bulkUploadFile) return;
    
    try {
      const formData = new FormData();
      formData.append('file', bulkUploadFile);
      
      // Simulate progress during upload
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      await apiClient.post(`/creators/${creatorId}/bulk-style-examples`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      clearInterval(interval);
      setUploadProgress(100);
      
      setSuccess('Examples uploaded successfully');
      setBulkUploadOpen(false);
      
      // Refresh the examples list
      const response = await apiClient.get<StyleExamplesResponse>(`/creators/${creatorId}/style-examples`, {
        params: {
          skip: page * rowsPerPage,
          limit: rowsPerPage,
          search: searchQuery || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
        }
      });
      setExamples(response.items);
      setTotalExamples(response.total);
    } catch (err: any) {
      console.error('Error uploading examples:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to upload examples');
    }
  };

  // Handle export of examples
  const handleExport = async () => {
    try {
      // Create CSV content from current examples
      const headers = ['fan_message', 'creator_response', 'category'];
      const rows = examples.map(ex => [
        `"${ex.fan_message.replace(/"/g, '""')}"`,
        `"${ex.creator_response.replace(/"/g, '""')}"`,
        `"${ex.category || ''}"`
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `creator_${creatorId}_style_examples.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('Examples exported successfully');
    } catch (err: any) {
      console.error('Error exporting examples:', err);
      setError(err.message || 'Failed to export examples');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
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
      
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Style Examples
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={handleBulkUploadOpen}
            >
              Bulk Import
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddExample}
            >
              Add Example
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {/* Search field */}
          <TextField
            placeholder="Search examples..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          {/* Category filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="category-filter-label">Category</InputLabel>
            <Select
              labelId="category-filter-label"
              id="category-filter"
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : examples.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No examples found.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddExample}
              sx={{ mt: 2 }}
            >
              Add Your First Example
            </Button>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Fan Message</strong></TableCell>
                    <TableCell><strong>Creator Response</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Date Added</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {examples.map((example) => (
                    <TableRow key={example.id}>
                      <TableCell 
                        sx={{ 
                          maxWidth: 200, 
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <Tooltip title={example.fan_message} enterDelay={500}>
                          <Typography variant="body2">
                            {example.fan_message}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          maxWidth: 250, 
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        <Tooltip title={example.creator_response} enterDelay={500}>
                          <Typography variant="body2">
                            {example.creator_response}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {example.category ? (
                          <Chip 
                            label={example.category} 
                            size="small" 
                            sx={{ 
                              bgcolor: 'primary.light', 
                              color: 'primary.dark',
                              fontWeight: 500,
                            }} 
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(example.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditExample(example)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(example)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalExamples}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
      
      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingExample ? 'Edit Style Example' : 'Add Style Example'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Controller
              name="fan_message"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Fan Message"
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                  variant="outlined"
                  error={!!errors.fan_message}
                  helperText={errors.fan_message?.message}
                  placeholder="Enter the fan's message here..."
                />
              )}
            />
            
            <Controller
              name="creator_response"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Creator Response"
                  fullWidth
                  multiline
                  rows={4}
                  margin="normal"
                  variant="outlined"
                  error={!!errors.creator_response}
                  helperText={errors.creator_response?.message}
                  placeholder="Enter the creator's response here..."
                />
              )}
            />
            
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel id="category-select-label">Category</InputLabel>
                  <Select
                    {...field}
                    labelId="category-select-label"
                    label="Category"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
            >
              {editingExample ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Example</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this example? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Bulk Upload Dialog */}
      <Dialog
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
      >
        <DialogTitle>Bulk Import Examples</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Upload a CSV file with fan messages and creator responses. The file should have the following columns:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
            fan_message,creator_response,category
          </Typography>
          <Button
            component="label"
            variant="outlined"
            startIcon={<FileUploadIcon />}
            sx={{ mt: 3 }}
          >
            Select CSV File
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={handleFileChange}
            />
          </Button>
          {bulkUploadFile && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Selected file: {bulkUploadFile.name}
            </Typography>
          )}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkUploadOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkUploadConfirm}
            variant="contained"
            disabled={!bulkUploadFile || uploadProgress > 0}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add button (floating) */}
      <Fab
        color="primary"
        aria-label="add example"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={handleAddExample}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}