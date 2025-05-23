// components/creators/StyleConfigTab.tsx - Fixed type issues
'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  FormControl, 
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  IconButton,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '../../lib/api';

// Creator style interface - updated to match backend model
interface CreatorStyle {
  id: number;
  creator_id: number;
  approved_emojis: string[] | null;
  case_style: string | null;
  text_replacements: Record<string, string> | null;
  sentence_separators: string[] | null;
  punctuation_rules: Record<string, any> | null;
  common_abbreviations: Record<string, string> | null;
  message_length_preferences: Record<string, number> | null;
  style_instructions: string | null;
  tone_range: string[] | null;
  created_at: string;
  updated_at: string;
}

// Props for style config tab
interface StyleConfigTabProps {
  creatorStyle: CreatorStyle | null;
  creatorId: number;
  setCreatorStyle: React.Dispatch<React.SetStateAction<CreatorStyle | null>>;
  setSuccess: React.Dispatch<React.SetStateAction<string | null>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

// Common tone options
const toneOptions = [
  'casual', 'formal', 'friendly', 'professional', 'enthusiastic', 
  'serious', 'humorous', 'playful', 'authoritative', 'empathetic',
  'assertive', 'supportive', 'passionate', 'calm', 'energetic',
  'thoughtful', 'inspirational', 'sarcastic', 'respectful'
];

// Form validation schema - updated to match CreatorStyle interface
const styleConfigSchema = z.object({
  case_style: z.enum(['lowercase', 'uppercase', 'sentence', 'title', 'custom']).nullable(),
  approved_emojis: z.array(z.string()).nullable(),
  sentence_separators: z.array(z.string()).nullable(),
  text_replacements: z.record(z.string(), z.string()).nullable(),
  common_abbreviations: z.record(z.string(), z.string()).nullable(),
  message_length_preferences: z.object({
    min_length: z.number().min(0).optional(),
    max_length: z.number().min(0).optional(),
    optimal_length: z.number().min(0).optional(),
  }).nullable(),
  punctuation_rules: z.object({
    use_ellipsis: z.boolean().optional(),
    use_exclamations: z.boolean().optional(),
    max_consecutive_exclamations: z.number().min(0).optional(),
  }).nullable(),
  style_instructions: z.string().nullable(),
  tone_range: z.array(z.string()).nullable(),
});

// Form type from schema
type StyleConfigFormValues = z.infer<typeof styleConfigSchema>;

export default function StyleConfigTab({ creatorStyle, creatorId, setCreatorStyle, setSuccess, setError }: StyleConfigTabProps) {
  const [saving, setSaving] = useState(false);
  const [newEmojiInput, setNewEmojiInput] = useState('');
  const [newSeparatorInput, setNewSeparatorInput] = useState('');
  const [newReplacementKey, setNewReplacementKey] = useState('');
  const [newReplacementValue, setNewReplacementValue] = useState('');
  const [newAbbreviationKey, setNewAbbreviationKey] = useState('');
  const [newAbbreviationValue, setNewAbbreviationValue] = useState('');

  // Initialize form with creator style data
  const defaultValues: StyleConfigFormValues = {
    case_style: creatorStyle?.case_style as any || 'sentence',
    approved_emojis: creatorStyle?.approved_emojis || [],
    sentence_separators: creatorStyle?.sentence_separators || ['.', '!', '?'],
    text_replacements: creatorStyle?.text_replacements || {},
    common_abbreviations: creatorStyle?.common_abbreviations || {},
    message_length_preferences: creatorStyle?.message_length_preferences || {
      min_length: 0,
      max_length: 500,
      optimal_length: 250,
    },
    punctuation_rules: creatorStyle?.punctuation_rules || {
      use_ellipsis: true,
      use_exclamations: true,
      max_consecutive_exclamations: 2,
    },
    style_instructions: creatorStyle?.style_instructions || '',
    tone_range: creatorStyle?.tone_range || [],
  };

  // Set up form
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<StyleConfigFormValues>({
    resolver: zodResolver(styleConfigSchema),
    defaultValues,
  });

  // Watch form values for real-time updates
  const watchEmojis = watch('approved_emojis');
  const watchSeparators = watch('sentence_separators');
  const watchReplacements = watch('text_replacements');
  const watchAbbreviations = watch('common_abbreviations');

  // Handle form submission
  const onSubmit = async (data: StyleConfigFormValues) => {
    setSaving(true);
    setError(null);
    
    try {
      // Prepare the data to send to the API
      const apiData = {
        ...data,
        creator_id: creatorId, // Ensure creator_id is included
      };

      let response;
      if (creatorStyle) {
        // Update existing style
        response = await apiClient.patch(`/creators/${creatorId}/style`, apiData);
      } else {
        // Create new style
        response = await apiClient.post(`/creators/${creatorId}/style`, apiData);
      }
      
      // Create updated style object with proper structure
      const updatedStyle: CreatorStyle = {
        id: creatorStyle?.id || response.id || Date.now(),
        creator_id: creatorId,
        approved_emojis: data.approved_emojis,
        case_style: data.case_style,
        text_replacements: data.text_replacements,
        sentence_separators: data.sentence_separators,
        punctuation_rules: data.punctuation_rules,
        common_abbreviations: data.common_abbreviations,
        message_length_preferences: data.message_length_preferences,
        style_instructions: data.style_instructions,
        tone_range: data.tone_range,
        created_at: creatorStyle?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setCreatorStyle(updatedStyle);
      setSuccess('Style configuration saved successfully!');
    } catch (err: any) {
      console.error('Error updating style config:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to update style configuration');
    } finally {
      setSaving(false);
    }
  };

  // Add new emoji
  const handleAddEmoji = () => {
    if (!newEmojiInput.trim()) return;
    
    const currentEmojis = watchEmojis || [];
    if (!currentEmojis.includes(newEmojiInput)) {
      setValue('approved_emojis', [...currentEmojis, newEmojiInput]);
    }
    setNewEmojiInput('');
  };

  // Remove emoji
  const handleRemoveEmoji = (emoji: string) => {
    const currentEmojis = watchEmojis || [];
    setValue('approved_emojis', currentEmojis.filter(e => e !== emoji));
  };

  // Add new separator
  const handleAddSeparator = () => {
    if (!newSeparatorInput.trim()) return;
    
    const currentSeparators = watchSeparators || [];
    if (!currentSeparators.includes(newSeparatorInput)) {
      setValue('sentence_separators', [...currentSeparators, newSeparatorInput]);
    }
    setNewSeparatorInput('');
  };

  // Remove separator
  const handleRemoveSeparator = (separator: string) => {
    const currentSeparators = watchSeparators || [];
    setValue('sentence_separators', currentSeparators.filter(s => s !== separator));
  };

  // Add new text replacement
  const handleAddReplacement = () => {
    if (!newReplacementKey.trim() || !newReplacementValue.trim()) return;
    
    const currentReplacements = watchReplacements || {};
    setValue('text_replacements', { 
      ...currentReplacements, 
      [newReplacementKey]: newReplacementValue 
    });
    
    setNewReplacementKey('');
    setNewReplacementValue('');
  };

  // Remove text replacement
  const handleRemoveReplacement = (key: string) => {
    const currentReplacements = watchReplacements || {};
    const { [key]: removed, ...rest } = currentReplacements;
    setValue('text_replacements', rest);
  };

  // Add new abbreviation
  const handleAddAbbreviation = () => {
    if (!newAbbreviationKey.trim() || !newAbbreviationValue.trim()) return;
    
    const currentAbbreviations = watchAbbreviations || {};
    setValue('common_abbreviations', { 
      ...currentAbbreviations, 
      [newAbbreviationKey]: newAbbreviationValue 
    });
    
    setNewAbbreviationKey('');
    setNewAbbreviationValue('');
  };

  // Remove abbreviation
  const handleRemoveAbbreviation = (key: string) => {
    const currentAbbreviations = watchAbbreviations || {};
    const { [key]: removed, ...rest } = currentAbbreviations;
    setValue('common_abbreviations', rest);
  };

  return (
    <Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Text styling options */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Text Styling
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Controller
                  name="case_style"
                  control={control}
                  render={({ field }) => (
                    <FormControl component="fieldset">
                      <FormLabel component="legend">Case Style</FormLabel>
                      <RadioGroup 
                        row 
                        value={field.value || 'sentence'}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <FormControlLabel value="lowercase" control={<Radio />} label="lowercase" />
                        <FormControlLabel value="uppercase" control={<Radio />} label="UPPERCASE" />
                        <FormControlLabel value="sentence" control={<Radio />} label="Sentence case" />
                        <FormControlLabel value="title" control={<Radio />} label="Title Case" />
                        <FormControlLabel value="custom" control={<Radio />} label="Custom" />
                      </RadioGroup>
                    </FormControl>
                  )}
                />
              </Box>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Approved Emojis
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {watchEmojis && watchEmojis.map((emoji) => (
                    <Chip
                      key={emoji}
                      label={emoji}
                      onDelete={() => handleRemoveEmoji(emoji)}
                      sx={{ fontSize: '1.2rem' }}
                    />
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    value={newEmojiInput}
                    onChange={(e) => setNewEmojiInput(e.target.value)}
                    placeholder="Add emoji"
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddEmoji}
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Sentence Separators
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {watchSeparators && watchSeparators.map((separator) => (
                    <Chip
                      key={separator}
                      label={separator}
                      onDelete={() => handleRemoveSeparator(separator)}
                    />
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    value={newSeparatorInput}
                    onChange={(e) => setNewSeparatorInput(e.target.value)}
                    placeholder="Add separator"
                    size="small"
                    sx={{ width: 120 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddSeparator}
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          {/* Message length preferences */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Message Length Preferences
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Controller
                  name="message_length_preferences.min_length"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Minimum Length (characters)"
                      type="number"
                      fullWidth
                      margin="normal"
                      InputProps={{
                        inputProps: { min: 0 }
                      }}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
                
                <Controller
                  name="message_length_preferences.max_length"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Maximum Length (characters)"
                      type="number"
                      fullWidth
                      margin="normal"
                      InputProps={{
                        inputProps: { min: 0 }
                      }}
                      value={field.value || 500}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
                
                <Controller
                  name="message_length_preferences.optimal_length"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Optimal Length (characters)"
                      type="number"
                      fullWidth
                      margin="normal"
                      InputProps={{
                        inputProps: { min: 0 }
                      }}
                      value={field.value || 250}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
              </Box>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Punctuation Rules
                </Typography>
                
                <Controller
                  name="punctuation_rules.use_ellipsis"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value || false}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Use ellipsis (...)"
                    />
                  )}
                />
                
                <Controller
                  name="punctuation_rules.use_exclamations"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value || false}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      }
                      label="Use exclamations (!)"
                    />
                  )}
                />
                
                <Controller
                  name="punctuation_rules.max_consecutive_exclamations"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Max Consecutive Exclamations"
                      type="number"
                      fullWidth
                      margin="normal"
                      InputProps={{
                        inputProps: { min: 0, max: 5 }
                      }}
                      value={field.value || 2}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
              </Box>
            </Paper>
          </Grid>
          
          {/* Text replacements */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Text Replacements
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Define words or phrases that should be replaced with alternatives.
              </Typography>
              
              <TableContainer sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Original</strong></TableCell>
                      <TableCell><strong>Replacement</strong></TableCell>
                      <TableCell width="10%"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {watchReplacements && Object.entries(watchReplacements).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell>{value}</TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRemoveReplacement(key)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!watchReplacements || Object.keys(watchReplacements).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No text replacements defined
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  value={newReplacementKey}
                  onChange={(e) => setNewReplacementKey(e.target.value)}
                  placeholder="Original"
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  value={newReplacementValue}
                  onChange={(e) => setNewReplacementValue(e.target.value)}
                  placeholder="Replacement"
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddReplacement}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Common abbreviations */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Common Abbreviations
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Define abbreviations commonly used by this creator.
              </Typography>
              
              <TableContainer sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Abbreviation</strong></TableCell>
                      <TableCell><strong>Full Form</strong></TableCell>
                      <TableCell width="10%"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {watchAbbreviations && Object.entries(watchAbbreviations).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell>{value}</TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRemoveAbbreviation(key)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!watchAbbreviations || Object.keys(watchAbbreviations).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No abbreviations defined
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  value={newAbbreviationKey}
                  onChange={(e) => setNewAbbreviationKey(e.target.value)}
                  placeholder="Abbreviation"
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  value={newAbbreviationValue}
                  onChange={(e) => setNewAbbreviationValue(e.target.value)}
                  placeholder="Full Form"
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddAbbreviation}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          {/* Tone range */}
          <Grid size={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Tone Range
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select the tones that best describe this creator's writing style.
              </Typography>
              
              <Controller
                name="tone_range"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={toneOptions}
                    value={field.value || []}
                    onChange={(_, newValue) => {
                      field.onChange(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Tone Range"
                        placeholder="Select tones"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          {...getTagProps({ index })}
                          key={option}
                        />
                      ))
                    }
                  />
                )}
              />
            </Paper>
          </Grid>
          
          {/* Style instructions */}
          <Grid size={12}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Style Instructions
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Provide detailed instructions about this creator's writing style.
              </Typography>
              
              <Controller
                name="style_instructions"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    multiline
                    rows={6}
                    fullWidth
                    placeholder="Enter detailed style instructions here..."
                    helperText="Describe the creator's tone, phrasing preferences, sentence structure, and any other specific style guidelines."
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
            </Paper>
          </Grid>
        </Grid>
        
        {/* Save button */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}