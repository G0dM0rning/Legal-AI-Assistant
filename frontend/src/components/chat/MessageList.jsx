import React, { useRef, useEffect } from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import MessageBubble from './MessageBubble';
import { ChatArea, MessagesContainer } from './ChatStyles';

const MessageList = ({ messages, isLoading, onAction, onSuggestionClick }) => {
    const suggestedQuestions = [
        "What are the key legal issues in this document?",
        "Provide a summary of the final ruling.",
        "List all the legal precedents cited.",
        "How does this affect current case law?"
    ];

    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <ChatArea>
            <MessagesContainer>
                {messages.length === 0 ? (
                    <Box sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', minHeight: '60vh', gap: 3, opacity: 0.6
                    }}>
                        <Box sx={{
                            width: 80, height: 80, borderRadius: '24px',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 12px 32px rgba(59, 130, 246, 0.3)',
                            mb: 2
                        }}>
                            <AutoAwesome sx={{ fontSize: 40, color: 'white' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'white' }}>How can I assist your case?</Typography>
                        <Typography variant="body1" sx={{ color: '#94a3b8', textAlign: 'center', maxWidth: 400 }}>
                            Upload documents or start a query for instant context-aware legal analysis and citations.
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mt: 2 }}>
                            {suggestedQuestions.map((q, i) => (
                                <Box
                                    key={i}
                                    onClick={() => onSuggestionClick && onSuggestionClick(q)}
                                    sx={{
                                        px: 2, py: 1, borderRadius: '12px', bgcolor: alpha('#1e293b', 0.5),
                                        border: '1px solid rgba(148, 163, 184, 0.1)', cursor: 'pointer',
                                        color: '#94a3b8', fontSize: '0.85rem',
                                        '&:hover': { bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6', borderColor: alpha('#3b82f6', 0.3) },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {q}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                ) : (
                    messages.map((msg, index) => (
                        <MessageBubble key={msg.id || index} message={msg} onAction={onAction} />
                    ))
                )}
                <div ref={chatEndRef} />
            </MessagesContainer>
        </ChatArea>
    );
};

export default MessageList;
