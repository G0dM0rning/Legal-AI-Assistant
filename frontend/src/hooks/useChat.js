import { useState, useRef, useCallback, useEffect } from 'react';
import { chatAPI, saveConversation, getConversations, deleteConversation } from '../services/api';

/**
 * Custom hook to manage chat logic, history, and streaming state.
 */
export const useChat = (user) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [attachedFiles, setAttachedFiles] = useState([]);
    const messagesRef = useRef([]);

    // Keep ref in sync with state
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const abortControllerRef = useRef(null);

    const fetchConversations = useCallback(async () => {
        try {
            if (user?.id) {
                const response = await getConversations(user.id);
                if (response.success) setConversations(response.data);
            }
        } catch (e) {
            console.error('Error fetching conversations:', e);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchConversations();
    }, [user, fetchConversations]);

    const extractErrorMessage = (err) => {
        if (typeof err === 'string') return err;
        if (err.message) {
            try {
                const parsed = JSON.parse(err.message);
                return parsed.detail || parsed.message || err.message;
            } catch {
                return err.message;
            }
        }
        return err.data?.detail || err.data?.message || err.detail || 'Connection failed';
    };

    const handleStopGeneration = useCallback(() => {
        setIsLoading(false); // Fail-safe: always unlock UI
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setMessages(prev => {
                const updated = [...prev];
                const idx = updated.findLastIndex(m => m.sender === 'ai');
                if (idx > -1 && updated[idx].isStreaming) {
                    updated[idx].isStreaming = false;
                    if (updated[idx].text) {
                        updated[idx].text += '\n\n*[Legal Analysis Interrupted by User]*';
                    } else {
                        updated[idx].text = '*[Legal Analysis Stopped]*';
                    }
                }
                return updated;
            });

            // Partial save
            if (user && messages.length > 0) {
                saveConversation(user.id, {
                    id: currentConversationId,
                    title: messages[0]?.text?.substring(0, 30) || 'Legal Inquiry',
                    messages: messages
                });
            }
        }
    }, [user, messages, currentConversationId]);

    const sendMessage = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userInput = input.trim();
        const userMessage = {
            text: userInput,
            sender: 'user',
            timestamp: new Date(),
            id: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setError(null);
        setIsLoading(true);

        const aiMsgId = Date.now() + 1;
        const aiMessage = {
            text: '',
            sender: 'ai',
            timestamp: new Date(),
            id: aiMsgId,
            sources: [],
            isStreaming: true
        };

        setMessages(prev => [...prev, aiMessage]);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            let accumulatedText = '';
            let latestMetadata = null;

            await chatAPI.streamMessage(
                userInput,
                (metadata) => {
                    latestMetadata = metadata;
                    setMessages(prev => {
                        const updated = [...prev];
                        const idx = updated.findIndex(m => m.id === aiMsgId);
                        if (idx > -1) {
                            updated[idx] = {
                                ...updated[idx],
                                sources: metadata.sources || [],
                                providerInfo: metadata.provider_info
                            };
                        }
                        return updated;
                    });
                },
                (chunk) => {
                    accumulatedText += chunk;
                    setMessages(prev => {
                        const updated = [...prev];
                        const idx = updated.findIndex(m => m.id === aiMsgId);
                        if (idx > -1) {
                            updated[idx] = {
                                ...updated[idx],
                                text: accumulatedText
                            };
                        }
                        return updated;
                    });
                },
                () => { },
                controller.signal,
                attachedFiles
            );

            setMessages(prev => {
                const updated = [...prev];
                const idx = updated.findIndex(m => m.id === aiMsgId);
                if (idx > -1) {
                    updated[idx].isStreaming = false;
                }
                return updated;
            });

            if (user) {
                // Use latest messages from ref to avoid losing concurrent updates (like file uploads)
                const finalMessages = [...messagesRef.current];
                const aiIdx = finalMessages.findIndex(m => m.id === aiMsgId);
                if (aiIdx > -1) {
                    finalMessages[aiIdx] = {
                        ...finalMessages[aiIdx],
                        text: accumulatedText,
                        isStreaming: false,
                        sources: latestMetadata?.sources || []
                    };
                }

                const res = await saveConversation(user.id, {
                    id: currentConversationId,
                    title: userInput.substring(0, 30) + '...',
                    messages: finalMessages,
                    attachedFiles: attachedFiles // Persist current session context
                });

                if (res.success && res.data?._id && !currentConversationId) {
                    setCurrentConversationId(res.data._id);
                }
                fetchConversations();
            }

        } catch (err) {
            if (err.name !== 'AbortError') {
                const msg = extractErrorMessage(err);
                setError(msg);
                setMessages(prev => {
                    const updated = [...prev];
                    const idx = updated.findIndex(m => m.id === aiMsgId);
                    if (idx > -1) {
                        if (updated[idx].text === '') {
                            updated[idx].text = `Error: ${msg}`;
                            updated[idx].isError = true;
                        }
                        updated[idx].isStreaming = false;
                    }
                    return updated;
                });
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [input, isLoading, user, messages, currentConversationId, fetchConversations, attachedFiles]);

    const loadConversation = useCallback((conv) => {
        setMessages(conv.messages || []);
        setCurrentConversationId(conv._id || conv.id);

        // Professional persistence: check both snake_case (API) and CamelCase (Local)
        const files = conv.attached_files || conv.attachedFiles;
        if (files && Array.isArray(files)) {
            setAttachedFiles(files);
        } else {
            const filesFromContext = conv.messages?.reduce((acc, msg) => {
                if (msg.sender === 'system' && msg.actions) {
                    msg.actions.forEach(a => {
                        if (a.type === 'summarize' && !acc.find(f => f.filename === a.filename)) {
                            acc.push({ filename: a.filename, status: 'ready', originalName: a.filename });
                        }
                    });
                }
                return acc;
            }, []) || [];
            setAttachedFiles(filesFromContext);
        }
    }, []);

    const startNewChat = useCallback(() => {
        setMessages([]);
        setCurrentConversationId(null);
        setAttachedFiles([]);
        setError(null);
    }, []);

    const removeConversation = useCallback(async (id) => {
        try {
            await deleteConversation(id);
            await fetchConversations();
            if (currentConversationId === id) startNewChat();
        } catch (e) {
            setError(extractErrorMessage(e));
        }
    }, [currentConversationId, fetchConversations, startNewChat]);

    return {
        messages,
        setMessages,
        input,
        setInput,
        conversations,
        isLoading,
        setIsLoading,
        error,
        setError,
        setCurrentConversationId,
        attachedFiles,
        setAttachedFiles,
        sendMessage,
        handleStopGeneration,
        loadConversation,
        startNewChat,
        removeConversation,
        fetchConversations
    };
};
