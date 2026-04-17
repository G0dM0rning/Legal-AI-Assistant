// src/pages/TryItNow.jsx
import React, { useState } from 'react';
import { Box, GlobalStyles, CssBaseline, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

// Hooks
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useSystemStatus } from '../hooks/useSystemStatus';

// Components
import Sidebar from '../components/chat/Sidebar';
import Header from '../components/chat/Header';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import { Chip, Stack, Tooltip } from '@mui/material';
import { FilePresent, Clear, Summarize } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
// Removed FileUploadModal

// Styles
import { MainContainer, MainSection, SidebarToggle, AttachmentBar, FileChip, SystemMessageContainer } from '../components/chat/ChatStyles';

// Utils
import { chatAPI as api } from '../services/api';
import { generatePdf, generateDocx, generateTxt } from '../utils/exportUtils';

const TryItNow = () => {
  const { user, logout } = useAuth();

  // Destructure state from hook
  const {
    messages, setMessages, input, setInput, conversations,
    isLoading: isChatLoading, setIsLoading: setChatLoading, error, setError,
    setCurrentConversationId, currentConversationId, attachedFiles, setAttachedFiles,
    sendMessage, handleStopGeneration,
    loadConversation, startNewChat, removeConversation, fetchConversations
  } = useChat(user);

  const { systemStatus } = useSystemStatus();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const abortControllerRef = React.useRef(null);

  const handleFileUpload = async (files) => {
    try {
      setChatLoading(true);
      setError(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const uploadPromises = files.map(file => api.uploadChatFile(file));
      // Note: currently api.uploadChatFile doesn't take a signal, but for future-proofing
      const results = await Promise.allSettled(uploadPromises);

      const successful = [];
      const failed = [];

      results.forEach((r, idx) => {
        if (r.status === 'fulfilled' && r.value.success) {
          successful.push({ ...r.value.data, originalName: files[idx].name });
        } else {
          const reason = r.status === 'rejected' ? r.reason.message : (r.value.message || 'Processing error');
          failed.push({ name: files[idx].name, reason });
        }
      });

      if (successful.length > 0) {
        const newAttached = successful.map(f => ({
          filename: f.filename,
          originalName: f.originalName,
          source_tag: f.source_tag,
          status: 'ready'
        }));
        setAttachedFiles(prev => [...prev, ...newAttached]);

        const successMsg = {
          text: `✅ Successfully analyzed **${successful.length}** document(s). You can now ask questions about their content or click "Summarize" below.`,
          sender: 'system',
          timestamp: new Date(),
          id: Date.now(),
          actions: successful.map(f => ({
            label: `Summarize ${f.originalName || f.filename}`,
            type: 'summarize',
            filename: f.filename,
            source_tag: f.source_tag
          }))
        };

        const updatedMessages = [...messages, successMsg];
        setMessages(updatedMessages);

        // Proactive Save: Ensure session context persists and GET the ID
        if (user) {
          try {
            const res = await api.saveConversation(user.id, {
              id: currentConversationId,
              title: successful[0].originalName.substring(0, 30),
              messages: updatedMessages,
              attachedFiles: [...attachedFiles, ...newAttached]
            });
            if (res.success && res.data?._id && !currentConversationId) {
              setCurrentConversationId(res.data._id);
              fetchConversations();
            }
          } catch (saveErr) {
            console.error("Auto-save after upload failed:", saveErr);
          }
        }
      }

      if (failed.length > 0) {
        setMessages(prev => [...prev, {
          text: `⚠️ **Upload Warning**: Could not process **${failed.length}** file(s).\n\n${failed.map(f => `* **${f.name}**: ${f.reason}`).join('\n')}`,
          sender: 'system',
          isError: true,
          timestamp: new Date(),
          id: Date.now() + 1
        }]);
      }
    } catch (err) {
      console.error('File upload logic error:', err);
      setError(err.message || 'Critical upload failure');
    } finally {
      setChatLoading(false);
    }
  };

  const handleDownloadChat = async (format) => {
    if (messages.length === 0) {
      setError("No messages to export");
      return;
    }

    try {
      const username = user?.name || 'User';
      switch (format) {
        case 'pdf': await generatePdf(messages, username); break;
        case 'docx': await generateDocx(messages, username); break;
        case 'txt': generateTxt(messages, username); break;
        default: break;
      }
    } catch (e) {
      console.error('Export failed:', e);
      setError("Failed to generate export file");
    }
  };

  const handleAction = async (action) => {
    if (action.type === 'summarize') {
      await handleSummarize(action.filename);
    } else if (action.type === 'download') {
      try {
        const blob = await api.downloadSummary(action.filename, action.format);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Summary_${action.filename}.${action.format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (err) {
        setError("Download failed");
      }
    }
  };

  const handleSummarize = async (filename) => {
    try {
      setChatLoading(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await api.summarizeDocument(filename);
      if (res.success) {
        setMessages(prev => [...prev, {
          text: `### Executive Case Summary\n\n${res.data.summary}`,
          sender: 'ai',
          timestamp: new Date(),
          id: Date.now(),
          actions: [
            { label: 'Download PDF', type: 'download', filename: filename, format: 'pdf' },
            { label: 'Download Word', type: 'download', filename: filename, format: 'docx' }
          ]
        }]);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Summarization failed");
    } finally {
      setChatLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <>
      <CssBaseline />
      <GlobalStyles
        styles={{
          'html, body, #root': {
            margin: 0, padding: 0, height: '100vh', width: '100vw', overflow: 'hidden !important',
          },
          '::-webkit-scrollbar': { display: 'none !important' },
          '*': { msOverflowStyle: 'none !important', scrollbarWidth: 'none !important' },
        }}
      />
      <MainContainer sx={{ bgcolor: '#0f172a' }}>
        <Sidebar
          isOpen={isSidebarOpen}
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={loadConversation}
          onNewChat={startNewChat}
          onDeleteConversation={removeConversation}
        />

        <SidebarToggle
          isOpen={isSidebarOpen}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </SidebarToggle>

        <MainSection>
          <Header
            user={user}
            systemStatus={systemStatus}
            onLogout={logout}
            onDownloadChat={handleDownloadChat}
          />

          <MessageList
            messages={messages}
            isLoading={isChatLoading}
            onAction={handleAction}
            onSuggestionClick={handleSuggestionClick}
          />

          <AnimatePresence>
            {attachedFiles.length > 0 && (
              <AttachmentBar>
                {attachedFiles.map((file, idx) => (
                  <FileChip
                    key={idx}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <FilePresent fontSize="small" />
                    <Box sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.originalName || file.filename}
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Summarize">
                        <IconButton size="small" onClick={() => handleSummarize(file.filename)} sx={{ p: 0.2, color: '#3b82f6' }}>
                          <Summarize sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))} sx={{ p: 0.2, color: '#94a3b8' }}>
                          <Clear sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </FileChip>
                ))}
              </AttachmentBar>
            )}
          </AnimatePresence>

          <MessageInput
            input={input}
            setInput={setInput}
            isLoading={isChatLoading}
            onSend={sendMessage}
            onStop={handleStopGeneration}
            onUpload={handleFileUpload}
          />
        </MainSection>
      </MainContainer>
    </>
  );
};

export default TryItNow;