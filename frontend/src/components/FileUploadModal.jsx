import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import {
  CheckCircle,
  Error
} from '@mui/icons-material';

const FileUploadModal = ({ open, onClose, onUpload, allowedTypes }) => {
  const [files, setFiles] = React.useState([]);
  const [errors, setErrors] = React.useState([]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const newErrors = [];
    
    const validFiles = newFiles.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      const isValid = allowedTypes.includes(ext);
      if (!isValid) {
        newErrors.push(`Unsupported file type: ${file.name}`);
      }
      return isValid;
    });

    setFiles(validFiles);
    setErrors(newErrors);
  };

  const handleUpload = () => {
    onUpload(files);
    handleClose();
  };

  const handleClose = () => {
    setFiles([]);
    setErrors([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Upload Files</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          Supported formats: {allowedTypes.join(', ').toUpperCase()}
        </Typography>
        
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept={allowedTypes.map(ext => `.${ext}`).join(',')}
        />
        
        <label htmlFor="file-upload">
          <Button variant="contained" component="span" fullWidth>
            Select Files
          </Button>
        </label>

        {files.length > 0 && (
          <List dense sx={{ mt: 2 }}>
            {files.map((file, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(2)} KB`} />
              </ListItem>
            ))}
          </List>
        )}

        {errors.length > 0 && (
          <List dense sx={{ mt: 2 }}>
            {errors.map((error, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Error color="error" />
                </ListItemIcon>
                <ListItemText primary={error} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleUpload} 
          color="primary" 
          disabled={files.length === 0 || errors.length > 0}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadModal;