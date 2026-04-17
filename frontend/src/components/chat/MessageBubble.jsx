import React from 'react';
import { Box, Typography, Avatar, alpha } from '@mui/material';
import { AutoAwesome, Person, InfoOutlined } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { MessageBubbleStyled, SourceTag, ActionButton, SystemMessageContainer } from './ChatStyles';
import { Download, Summarize } from '@mui/icons-material';

const MessageBubble = ({ message, onAction }) => {
    const isUser = message.sender === 'user';
    const isAi = message.sender === 'ai';
    const isSystem = message.sender === 'system';

    if (isSystem) {
        return (
            <SystemMessageContainer isError={message.isError}>
                <Box>
                    <InfoOutlined fontSize="small" sx={{ mt: 0.3 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%' }}>
                        <ReactMarkdown
                            components={{
                                p: ({ node, ...props }) => <Typography variant="body2" sx={{ fontWeight: 500, display: 'block' }} {...props} />,
                                strong: ({ node, ...props }) => <span style={{ fontWeight: 700, color: '#93c5fd' }} {...props} />
                            }}
                        >
                            {message.text}
                        </ReactMarkdown>
                        {message.actions?.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}>
                                {message.actions.map((action, idx) => (
                                    <ActionButton
                                        key={idx}
                                        size="small"
                                        variant={action.type === 'summarize' ? 'contained' : 'outlined'}
                                        startIcon={action.type === 'summarize' ? <Summarize /> : <Download />}
                                        onClick={() => onAction && onAction(action)}
                                    >
                                        {action.label}
                                    </ActionButton>
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>
            </SystemMessageContainer>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            alignItems: isUser ? 'flex-end' : 'flex-start'
        }}>
            <Box sx={{ display: 'flex', gap: 2, maxWidth: isUser ? '90%' : '100%', flexDirection: isUser ? 'row-reverse' : 'row' }}>
                <Avatar
                    sx={{
                        width: 32, height: 32,
                        mt: 1,
                        bgcolor: isUser ? '#3b82f6' : '#8b5cf6',
                        boxShadow: `0 0 15px ${alpha(isUser ? '#3b82f6' : '#8b5cf6', 0.3)}`
                    }}
                >
                    {isUser ? <Person fontSize="small" /> : <AutoAwesome fontSize="small" />}
                </Avatar>

                <MessageBubbleStyled
                    isUser={isUser}
                    isError={message.isError}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <ReactMarkdown
                        components={{
                            p: ({ node, ...props }) => <Typography variant="body1" sx={{ mb: 1.5, '&:last-child': { mb: 0 } }} {...props} />,
                            code: ({ node, inline, ...props }) => (
                                <code
                                    style={{
                                        backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 4px',
                                        borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.9em'
                                    }}
                                    {...props}
                                />
                            )
                        }}
                    >
                        {message.text}
                    </ReactMarkdown>

                </MessageBubbleStyled>
            </Box>
        </Box>
    );
};

export default MessageBubble;
