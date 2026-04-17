import React, { useState } from 'react';
import {
    Box, Typography, IconButton, Button, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, alpha
} from '@mui/material';
import { Close, CloudUpload, InsertDriveFile, Delete } from '@mui/icons-material';

const FileUploadModal = ({
    open,
    onClose,
    onUpload,
    allowedTypes = ['pdf', 'docx', 'doc', 'txt', 'pptx', 'xlsx', 'csv', 'json'],
    title = "Upload Document",
    description = "Select files to upload"
}) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        const validFiles = files.filter(file => {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            return allowedTypes.includes(fileExtension);
        });

        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
        } else {
            alert(`Invalid file type. Allowed types: ${allowedTypes.join(', ').toUpperCase()}`);
        }
    };

    const handleRemoveFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length > 0 && onUpload) {
            setIsUploading(true);
            try {
                await onUpload(selectedFiles);
                setSelectedFiles([]);
                onClose();
            } catch (error) {
                console.error('Upload error:', error);
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: '#0f172a',
                    color: '#f8fafc',
                    borderRadius: 3,
                    backgroundImage: 'none',
                    border: '1px solid rgba(148, 163, 184, 0.1)'
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <CloudUpload fontSize="small" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: '#94a3b8' }}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ mt: 1 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                    {description}
                </Typography>

                <Box
                    sx={{
                        border: '2px dashed',
                        borderColor: selectedFiles.length > 0 ? '#10b981' : alpha('#3b82f6', 0.5),
                        borderRadius: 3,
                        p: 4,
                        textAlign: 'center',
                        backgroundColor: alpha('#3b82f6', 0.03),
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            borderColor: '#3b82f6',
                            backgroundColor: alpha('#3b82f6', 0.05),
                        }
                    }}
                    onClick={() => document.getElementById('file-input-chat').click()}
                >
                    <input
                        id="file-input-chat"
                        type="file"
                        multiple
                        accept={allowedTypes.map(ext => `.${ext}`).join(',')}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <CloudUpload sx={{ fontSize: 48, color: alpha('#3b82f6', 0.7), mb: 2 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Drag & drop legal docs'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Supported: {allowedTypes.join(', ').toUpperCase()}
                    </Typography>
                </Box>

                {selectedFiles.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
                            Files to upload
                        </Typography>
                        <Box sx={{ maxHeight: 180, overflowY: 'auto', pr: 1 }}>
                            {selectedFiles.map((file, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 1.5,
                                        mb: 1,
                                        bgcolor: alpha('#1e293b', 0.5),
                                        borderRadius: 2,
                                        border: '1px solid rgba(148, 163, 184, 0.05)'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                                        <InsertDriveFile sx={{ color: '#3b82f6', fontSize: 20 }} />
                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#f8fafc' }} noWrap>
                                                {file.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <IconButton size="small" onClick={() => handleRemoveFile(index)} sx={{ color: '#ef4444' }}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button onClick={onClose} sx={{ color: '#94a3b8' }}>Cancel</Button>
                <Button
                    onClick={handleUpload}
                    variant="contained"
                    disabled={selectedFiles.length === 0 || isUploading}
                    sx={{
                        borderRadius: 2,
                        px: 4,
                        bgcolor: '#3b82f6',
                        '&:hover': { bgcolor: '#2563eb' }
                    }}
                    startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {isUploading ? 'Uploading...' : 'Confirm Upload'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FileUploadModal;
