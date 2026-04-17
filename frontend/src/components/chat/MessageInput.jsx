import React from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import { AttachFile, Send, Stop } from '@mui/icons-material';
import { InputSection, InputContainer } from './ChatStyles';

const MessageInput = ({
    input,
    setInput,
    isLoading,
    onSend,
    onStop,
    onUpload
}) => {
    const fileInputRef = React.useRef(null);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0 && onUpload) {
            onUpload(files);
        }
        // Reset so same file can be uploaded again
        e.target.value = '';
    };

    return (
        <InputSection>
            <InputContainer>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.doc,.txt,.pptx,.xlsx,.csv,.json"
                    />
                    <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        sx={{ color: '#94a3b8', '&:hover': { color: '#3b82f6' }, ml: 1 }}
                    >
                        <AttachFile />
                    </IconButton>

                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Describe your legal query..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading && !input}
                        sx={{
                            '& .MuiInputBase-root': {
                                color: 'white',
                                fontSize: '1rem',
                                p: 1.5,
                            },
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        }}
                    />

                    <Box sx={{ mr: 1 }}>
                        {isLoading ? (
                            <IconButton
                                onClick={onStop}
                                sx={{
                                    bgcolor: '#ef4444', color: 'white',
                                    '&:hover': { bgcolor: '#dc2626' },
                                    width: 44, height: 44
                                }}
                            >
                                <Stop />
                            </IconButton>
                        ) : (
                            <IconButton
                                onClick={onSend}
                                disabled={!input.trim()}
                                sx={{
                                    bgcolor: input.trim() ? '#3b82f6' : 'rgba(148, 163, 184, 0.1)',
                                    color: 'white',
                                    '&:hover': { bgcolor: '#2563eb' },
                                    transition: 'all 0.2s',
                                    width: 44, height: 44
                                }}
                            >
                                <Send sx={{ fontSize: 20 }} />
                            </IconButton>
                        )}
                    </Box>
                </Box>
            </InputContainer>
        </InputSection>
    );
};

export default MessageInput;
