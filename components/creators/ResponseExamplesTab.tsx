// components/creators/ResponseExamplesTab.tsx - Fixed React key prop issue

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
  Rating,
  Stack,
  Collapse,
  Card,
  CardContent,
  Snackbar,
  LinearProgress,
} from '@mui/material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import StarIcon from '@mui/icons-material/Star';
import { apiClient } from '../../lib/api';
import { format } from 'date-fns';
import React from 'react';

// Response example interfaces
interface CreatorResponse {
  id: number;
  example_id: number;
  response_text: string;
  ranking: number | null;
}

interface ResponseExample {
  id: number;
  creator_id: number;
  fan_message: string;
  category: string | null;
  created_at: string;
  updated_at: string;
  responses: CreatorResponse[];
}

// Response example form validation schema
const responseExampleSchema = z.object({
  fan_message: z.string().min(1, 'Fan message is required'),
  category: z.string().nullable(),
  responses: z.array(z.object({
    response_text: z.string().min(1, 'Response text is required'),
    ranking: z.number().min(0).max(5).nullable(),
  })).min(1, 'At least one response is required'),
});

// Form type from schema
type ResponseExampleFormValues = z.infer<typeof responseExampleSchema>;

// Props for response examples tab
interface ResponseExamplesTabProps {
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

export default function ResponseExamplesTab({ creatorId }: ResponseExamplesTabProps) {
  const [examples, setExamples] = useState<ResponseExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExample, setEditingExample] = useState<ResponseExample | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExample, setSelectedExample] = useState<ResponseExample | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Example mock data - replace with actual API call
  const mockExamples: ResponseExample[] = [
    {
      id: 1,
      creator_id: creatorId,
      fan_message: "Hey, I'm visiting your city next month! Any recommendations?",
      category: "Question",
      created_at: "2025-03-15T12:00:00Z",
      updated_at: "2025-03-15T12:00:00Z",
      responses: [
        {
          id: 1,
          example_id: 1,
          response_text: "Omg, that's awesome! I've got tons of recommendations! What are you into - food, art, nightlife? My absolute fave spots are La Luna for dinner (get the truffle pasta!), The Highline for walking, and MoMA PS1 for art. How long are you staying? 😊",
          ranking: 5
        },
        {
          id: 2,
          example_id: 1,
          response_text: "Nice! You should definitely check out Central Park, Times Square, and the Empire State Building while you're here. Let me know if you need any specific recommendations!",
          ranking: 3
        },
        {
          id: 3,
          example_id: 1,
          response_text: "I'd be happy to recommend some places! What kind of things are you interested in doing during your visit?",
          ranking: 2
        }
      ]
    },
    {
      id: 2,
      creator_id: creatorId,
      fan_message: "Just bought your new book and I'm loving it so far!",
      category: "Compliment",
      created_at: "2025-03-16T14:20:00Z",
      updated_at: "2025-03-16T14:20:00Z",
      responses: [
        {
          id: 4,
          example_id: 2,
          response_text: "OMG thank you so much!! 🥰 I'm seriously so happy you're enjoying it! That means the world to me. Which part are you at? I'd love to hear your thoughts when you finish it! xoxo",
          ranking: 5
        },
        {
          id: 5,
          example_id: 2,
          response_text: "Thank you for your support! I hope you enjoy the rest of the book.",
          ranking: 1
        }
      ]
    },
    {
      id: 3,
      creator_id: creatorId,
      fan_message: "What's your skincare routine? Your skin always looks amazing!",
      category: "Question",
      created_at: "2025-03-17T09:45:00Z",
      updated_at: "2025-03-17T09:45:00Z",
      responses: [
        {
          id: 6,
          example_id: 3,
          response_text: "Aww thank you! ✨ My skincare routine is actually pretty simple! I always double cleanse at night, use vitamin C in the morning, and NEVER skip sunscreen (seriously, it's the secret weapon lol). Oh and I drink tons of water! Been loving the new @GlowSerum recently too - have you tried it? 💦",
          ranking: 5
        },
        {
          id: 7,
          example_id: 3,
          response_text: "Thanks! I use cleanser, toner, serum, moisturizer, and SPF. Drinking water helps too!",
          ranking: 3
        },
        {
          id: 8,
          example_id: 3,
          response_text: "I appreciate that! I actually don't do anything special, just genetics I guess.",
          ranking: 1
        }
      ]
    }
  ];

  // Form for adding/editing examples
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ResponseExampleFormValues>({
    resolver: zodResolver(responseExampleSchema),
    defaultValues: {
      fan_message: '',
      category: null,
      responses: [{ response_text: '', ranking: 3 }],
    }
  });

  // Field array for responses
  const { fields, append, remove } = useFieldArray({
    control,
    name: "responses",
  });

  // Fetch examples from API
  useEffect(() => {
    const fetchExamples = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real app, you would fetch from the API
        const response = await apiClient.get(`/creators/${creatorId}/response-examples`);
        setExamples(response);
        
        // Using mock data for now
        setExamples(mockExamples);
      } catch (err: any) {
        console.error('Error fetching response examples:', err);
        setError(err.message || 'Failed to load response examples');
      } finally {
        setLoading(false);
      }
    };

    fetchExamples();
  }, [creatorId]);

  // Filter examples based on search query and category
  const filteredExamples = examples.filter((example) => {
    const matchesSearch = 
      searchQuery === '' || 
      example.fan_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      example.responses.some(resp => 
        resp.response_text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesCategory = 
      categoryFilter === 'all' || 
      example.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get examples for current page
  const paginatedExamples = filteredExamples.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Toggle row expansion
  const handleToggleRow = (exampleId: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exampleId)) {
        newSet.delete(exampleId);
      } else {
        newSet.add(exampleId);
      }
      return newSet;
    });
  };

  // Open add example dialog
  const handleAddExample = () => {
    setEditingExample(null);
    reset({
      fan_message: '',
      category: null,
      responses: [{ response_text: '', ranking: 3 }],
    });
    setDialogOpen(true);
  };

  // Open edit example dialog
  const handleEditExample = (example: ResponseExample) => {
    setEditingExample(example);
    reset({
      fan_message: example.fan_message,
      category: example.category,
      responses: example.responses.map(resp => ({
        response_text: resp.response_text,
        ranking: resp.ranking || 3,
      })),
    });
    setDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteClick = (example: ResponseExample) => {
    setSelectedExample(example);
    setDeleteDialogOpen(true);
  };

  // Handle form submission for add/edit
  const onSubmit = async (data: ResponseExampleFormValues) => {
    setError(null);
    setSuccess(null);
    
    try {
      if (editingExample) {
        // Update existing example
        // In a real app, you would update via the API
        await apiClient.patch(`/creators/${creatorId}/response-examples/${editingExample.id}`, data);
        
        // Update local state
        setExamples(examples.map(ex => 
          ex.id === editingExample.id 
            ? {
                ...ex,
                fan_message: data.fan_message,
                category: data.category,
                responses: data.responses.map((resp, idx) => ({
                  id: ex.responses[idx]?.id || Math.random() * 1000, // mock id
                  example_id: ex.id,
                  response_text: resp.response_text,
                  ranking: resp.ranking,
                })),
              }
            : ex
        ));
        
        setSuccess('Example updated successfully');
      } else {
        // Add new example
        // In a real app, you would add via the API
        const response = await apiClient.post(`/creators/${creatorId}/response-examples`, data);
        
        // Add to local state with mock IDs
        const newExampleId = Math.max(0, ...examples.map(e => e.id)) + 1;
        const newExample: ResponseExample = {
          id: newExampleId,
          creator_id: creatorId,
          fan_message: data.fan_message,
          category: data.category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          responses: data.responses.map((resp, idx) => ({
            id: newExampleId * 100 + idx,
            example_id: newExampleId,
            response_text: resp.response_text,
            ranking: resp.ranking,
          })),
        };
        
        setExamples([...examples, newExample]);
        setSuccess('Example added successfully');
      }
      
      setDialogOpen(false);
    } catch (err: any) {
      console.error('Error saving example:', err);
      setError(err.message || 'Failed to save example');
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedExample) return;
    
    try {
      // In a real app, you would delete via the API
      await apiClient.delete(`/creators/${creatorId}/response-examples/${selectedExample.id}`);
      
      // Update local state
      setExamples(examples.filter(ex => ex.id !== selectedExample.id));
      setSuccess('Example deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedExample(null);
    } catch (err: any) {
      console.error('Error deleting example:', err);
      setError(err.message || 'Failed to delete example');
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
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // In a real app, you would upload via the API
      const formData = new FormData();
      formData.append('file', bulkUploadFile);
      await apiClient.post(`/creators/${creatorId}/bulk-response-examples`, formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });
      
      setSuccess('Examples uploaded successfully');
      setBulkUploadOpen(false);
      
      // In a real app, you would refetch the examples
      const response = await apiClient.get(`/creators/${creatorId}/response-examples`);
      setExamples(response);
    } catch (err: any) {
      console.error('Error uploading examples:', err);
      setError(err.message || 'Failed to upload examples');
    }
  };

  // Handle export of examples
  const handleExport = async () => {
    try {
      // In a real app, you would GET the CSV from the API
      const response = await apiClient.get(`/creators/${creatorId}/response-examples/export`, {
        responseType: 'blob',
      });
      
      // Create CSV content manually for mock
      const headers = ['fan_message', 'category', 'response_text', 'ranking'];
      const rows: string[][] = [];
      
      examples.forEach(ex => {
        ex.responses.forEach(resp => {
          rows.push([
            `"${ex.fan_message.replace(/"/g, '""')}"`,
            `"${ex.category || ''}"`,
            `"${resp.response_text.replace(/"/g, '""')}"`,
            `${resp.ranking || 0}`
          ]);
        });
      });
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `creator_${creatorId}_response_examples.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
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
            Response Examples
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
        ) : filteredExamples.length === 0 ? (
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
                    <TableCell width="5%"></TableCell>
                    <TableCell><strong>Fan Message</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell align="center"><strong>Responses</strong></TableCell>
                    <TableCell><strong>Date Added</strong></TableCell>
                    <TableCell align="right"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedExamples.map((example) => {
                    // FIXED: Use React.Fragment with proper key
                    return (
                      <React.Fragment key={`example-${example.id}`}>
                        <TableRow 
                          sx={{
                            '&:hover': { bgcolor: 'background.default' },
                            bgcolor: expandedRows.has(example.id) ? 'background.default' : 'inherit',
                          }}
                        >
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              onClick={() => handleToggleRow(example.id)}
                              aria-label={expandedRows.has(example.id) ? "Collapse" : "Expand"}
                            >
                              {expandedRows.has(example.id) ? 
                                <ExpandLessIcon /> : 
                                <ExpandMoreIcon />
                              }
                            </IconButton>
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              maxWidth: 250, 
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleToggleRow(example.id)}
                          >
                            <Tooltip title={example.fan_message} enterDelay={500}>
                              <Typography variant="body2">
                                {example.fan_message}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell onClick={() => handleToggleRow(example.id)} sx={{ cursor: 'pointer' }}>
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
                          <TableCell align="center" onClick={() => handleToggleRow(example.id)} sx={{ cursor: 'pointer' }}>
                            <Typography variant="body2">
                              {example.responses.length}
                            </Typography>
                          </TableCell>
                          <TableCell onClick={() => handleToggleRow(example.id)} sx={{ cursor: 'pointer' }}>
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
                        <TableRow key={`collapse-${example.id}`}>
                          <TableCell 
                            sx={{ py: 0 }} 
                            colSpan={6}
                          >
                            <Collapse 
                              in={expandedRows.has(example.id)} 
                              timeout="auto" 
                              unmountOnExit
                            >
                              <Box sx={{ py: 2, px: 3 }}>
                                <Typography variant="subtitle2" gutterBottom component="div">
                                  Responses
                                </Typography>
                                {example.responses.sort((a, b) => (b.ranking || 0) - (a.ranking || 0)).map((response) => (
                                  <Card 
                                    key={response.id} 
                                    variant="outlined" 
                                    sx={{ 
                                      mb: 2, 
                                      borderColor: (response.ranking || 0) >= 4 ? 'primary.main' : 'divider'
                                    }}
                                  >
                                    <CardContent>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Rating 
                                          value={response.ranking || 0} 
                                          readOnly 
                                          precision={1}
                                          emptyIcon={<StarIcon style={{ opacity: 0.3 }} fontSize="inherit" />}
                                        />
                                        <Chip 
                                          label={response.ranking === 5 ? "Best" : response.ranking === 4 ? "Great" : response.ranking === 3 ? "Good" : response.ranking === 2 ? "Fair" : "Poor"} 
                                          size="small"
                                          color={response.ranking === 5 ? "primary" : response.ranking === 4 ? "primary" : response.ranking === 3 ? "default" : response.ranking === 2 ? "default" : "error"}
                                          sx={{ 
                                            fontWeight: 500,
                                            opacity: response.ranking === null ? 0 : 1
                                          }}
                                        />
                                      </Box>
                                      <Typography variant="body2">
                                        {response.response_text}
                                      </Typography>
                                    </CardContent>
                                  </Card>
                                ))}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredExamples.length}
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
          {editingExample ? 'Edit Response Example' : 'Add Response Example'}
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
            
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Response Options
            </Typography>
            
            {errors.responses && typeof errors.responses.message === 'string' && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.responses.message}
              </Alert>
            )}
            
            {fields.map((field, index) => (
              <Card key={field.id} variant="outlined" sx={{ mb: 3, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="subtitle2">
                    Response {index + 1}
                  </Typography>
                  {fields.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => remove(index)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                
                <Controller
                  name={`responses.${index}.response_text`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Response Text"
                      fullWidth
                      multiline
                      rows={3}
                      margin="normal"
                      variant="outlined"
                      error={!!errors.responses?.[index]?.response_text}
                      helperText={errors.responses?.[index]?.response_text?.message}
                      placeholder="Enter the creator's response here..."
                    />
                  )}
                />
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Response Quality Ranking
                  </Typography>
                  
                  <Controller
                    name={`responses.${index}.ranking`}
                    control={control}
                    render={({ field }) => (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Rating 
                          {...field}
                          onChange={(_, value) => field.onChange(value)}
                          precision={1}
                          size="large"
                        />
                        <Typography variant="body2" color="text.secondary">
                          {field.value === 5 ? "Best" : 
                           field.value === 4 ? "Great" : 
                           field.value === 3 ? "Good" : 
                           field.value === 2 ? "Fair" : 
                           field.value === 1 ? "Poor" : ""}
                        </Typography>
                      </Box>
                    )}
                  />
                </Box>
              </Card>
            ))}
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => append({ response_text: '', ranking: 3 })}
              fullWidth
              sx={{ mt: 1 }}
            >
              Add Another Response Option
            </Button>
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
        <DialogTitle>Bulk Import Response Examples</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Upload a CSV file with fan messages and response options. The file should have the following columns:
          </Typography>
          <Typography variant="body2" component="pre" sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
            fan_message,category,response_text,ranking
          </Typography>
          <Typography paragraph sx={{ mt: 2 }}>
            You can include multiple responses for the same fan message by repeating the fan_message and category in multiple rows.
          </Typography>
          
          <Button
            component="label"
            variant="outlined"
            startIcon={<FileUploadIcon />}
            sx={{ mt: 2 }}
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
          {uploadProgress > 0 && (
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