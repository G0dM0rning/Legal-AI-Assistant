// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Generic API request function with proper headers
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  const config = {
    method: options.method || 'GET',
    credentials: 'include', // HttpOnly Cookie support
    headers: {
      ...options.headers,
    },
  };

  if (token && token !== 'null' && token !== 'undefined') {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle request body
  if (options.body) {
    if (options.body instanceof FormData) {
      // For FormData, let the browser set the Content-Type
      config.body = options.body;
    } else {
      // For JSON, set Content-Type and stringify
      config.headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(options.body);
    }
  }

  // Security: Removed verbose logging of request headers and body to prevent token exposure in console
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔄 [API] ${config.method} -> ${endpoint}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = {
          detail: `HTTP ${response.status} ${response.statusText}`,
          status: response.status
        };
      }

      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ [API Error] ${endpoint}:`, errorData);
      }

      // Create a more detailed error message
      const errorMessage = errorData.detail ||
        errorData.message ||
        errorData.error ||
        `Request failed with status ${response.status}`;

      const enhancedError = new Error(errorMessage);
      enhancedError.status = response.status;
      enhancedError.data = errorData;

      throw enhancedError;
    }

    const data = await response.json();
    return data;

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ [Network/API Failure] ${endpoint}:`, error.message);
    }

    // Re-throw with enhanced information
    const enhancedError = new Error(error.message || 'Network request failed');
    enhancedError.status = error.status;
    enhancedError.data = error.data;
    enhancedError.originalError = error;

    throw enhancedError;
  }
};

// ========================
// Chat API Functions - UPDATED
// ========================

export const chatAPI = {
  // Send chat message - FIXED: Support multiple parameter formats
  sendMessage: async (message) => {
    return await apiRequest('/chat', {
      method: 'POST',
      body: { query: message },  // Using 'query' parameter as expected by backend
    });
  },

  // Alternative method that accepts different payload formats
  sendChat: async (payload) => {
    // Handle both string messages and object payloads
    const requestBody = typeof payload === 'string'
      ? { query: payload }
      : payload.query ? payload : { query: payload.message || payload.text };

    return await apiRequest('/chat', {
      method: 'POST',
      body: requestBody,
    });
  },

  // Stream chat message (for professional real-time responses)
  streamMessage: async (query, onMetadata, onChunk, onDone, signal, attachments = []) => {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      credentials: 'include', // HttpOnly Cookie support
      headers,
      body: JSON.stringify({
        query,
        stream: true,
        attachments // Pass along source_tag metadata for RAG isolation
      }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Streaming failed: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        if (signal && signal.aborted) {
          reader.cancel();
          break;
        }

        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              if (onDone) onDone();
              return; // End the stream and the promise
            }

            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'metadata' && onMetadata) {
                onMetadata(data);
              } else if (data.type === 'content' && onChunk) {
                onChunk(data.delta);
              }
            } catch (e) {
              console.error('Error parsing SSE chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Stream reading aborted');
      } else {
        console.error('Stream reading error:', error);
      }
      throw error;
    } finally {
      reader.releaseLock();
    }
  },

  // Get chat history (if implemented in backend)
  getChatHistory: async (userId) => {
    return await apiRequest(`/api/chat/history/${userId}`);
  },

  // Test chat endpoint connectivity
  testConnection: async () => {
    try {
      const response = await chatAPI.sendMessage('Hello');
      return {
        success: true,
        message: 'Chat endpoint is working',
        data: response
      };
    } catch (error) {
      return {
        success: false,
        message: `Chat endpoint error: ${error.message}`,
        error: error
      };
    }
  },

  // Upload document for the current session (Personal/Session awareness)
  uploadChatFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await apiRequest('/chat/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Summarize a specific document or current context
  summarizeDocument: async (filename) => {
    return await apiRequest('/chat/summarize', {
      method: 'POST',
      body: { filename },
    });
  },

  // Download summary in specific format
  downloadSummary: async (filename, format) => {
    // This will return a blob/file response
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/chat/summarize/download?filename=${filename}&format=${format}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Download failed');
    return await response.blob();
  }
};

// ========================
// Auth API Functions
// ========================

export const authAPI = {
  // User registration
  register: async (userData) => {
    return await apiRequest('/register', {
      method: 'POST',
      body: userData,
    });
  },

  // User login
  login: async (credentials) => {
    return await apiRequest('/login', {
      method: 'POST',
      body: credentials,
    });
  },

  // Admin registration
  adminRegister: async (adminData) => {
    return await apiRequest('/admin/signup', {
      method: 'POST',
      body: adminData,
    });
  },

  // Admin login
  adminLogin: async (credentials) => {
    return await apiRequest('/admin/signin', {
      method: 'POST',
      body: credentials,
    });
  },

  // Verify email address
  verifyEmail: async (token) => {
    return await apiRequest('/verify-email', {
      method: 'POST',
      body: { token }
    });
  },

  // Resend verification email
  resendVerification: async (email) => {
    return await apiRequest('/resend-verification', {
      method: 'POST',
      body: { email }
    });
  },

  // Forgot password request
  forgotPassword: async (email) => {
    return await apiRequest('/forgot-password', {
      method: 'POST',
      body: { email }
    });
  },

  // Reset password with token
  resetPassword: async (token, password) => {
    return await apiRequest('/reset-password', {
      method: 'POST',
      body: { token, password }
    });
  },

  // Validate token
  validateToken: async () => {
    return await apiRequest('/auth/validate');
  }
};

// ========================
// Admin API Functions
// ========================

export const adminAPI = {
  // Dashboard stats
  getDashboardStats: async () => {
    return await apiRequest('/admin/stats');
  },

  // Training history with search and status filters
  getTrainingHistory: async (page = 1, limit = 50, search = '', status = '') => {
    let url = `/admin/training-history?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${status}`;
    return await apiRequest(url);
  },

  // Detailed system status (Admin only)
  getAdminSystemStatus: async () => {
    return await apiRequest('/admin/system-status');
  },

  // Upload document
  uploadDocument: async (file, adminData) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('adminId', adminData.id || 'admin_001');
    formData.append('adminName', adminData.username || 'Admin');

    return await apiRequest('/admin/train', {
      method: 'POST',
      body: formData,
    });
  },

  // Bulk train existing uploads
  bulkTrainDocuments: async () => {
    return await apiRequest('/admin/train/bulk', {
      method: 'POST'
    });
  },

  // Users list
  getUsersList: async (page = 1, limit = 10) => {
    return await apiRequest(`/admin/users?page=${page}&limit=${limit}`);
  },

  // Public system status
  getSystemStatus: async () => {
    return await apiRequest('/system/status');
  },

  // Delete training document
  deleteTrainingDocument: async (documentId) => {
    return await apiRequest(`/admin/training/document/${documentId}`, {
      method: 'DELETE',
    });
  },

  // Resume training for failed/partial document
  resumeTraining: async (documentId) => {
    return await apiRequest(`/admin/training/resume/${documentId}`, {
      method: 'POST'
    });
  },

  // Get real-time training status for a specific document
  getTrainingStatus: async (documentId) => {
    return await apiRequest(`/admin/training/status/${documentId}`);
  },

  // Settings Management
  getSettings: async () => {
    return await apiRequest('/admin/settings');
  },

  updateSettings: async (settingsData) => {
    return await apiRequest('/admin/settings', {
      method: 'PATCH',
      body: settingsData
    });
  },

  // Security Operations
  rotateSecretKey: async () => {
    return await apiRequest('/admin/security/rotate-key', {
      method: 'POST'
    });
  },

  revokeAllSessions: async () => {
    return await apiRequest('/admin/security/revoke-sessions', {
      method: 'POST'
    });
  },

  // Toggle user active status
  toggleUserStatus: async (userId, isActive) => {
    return await apiRequest(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: { is_active: isActive }
    });
  }
};

// ========================
// Conversation API Functions - PERSISTED VERSION
// ========================

export const saveConversation = async (userId, conversation) => {
  try {
    console.log('Saving conversation to backend:', userId);
    return await apiRequest('/conversations', {
      method: 'POST',
      body: {
        id: conversation.id && conversation.id.length > 15 ? conversation.id : null,
        title: conversation.title || 'New Conversation',
        messages: conversation.messages,
        attached_files: conversation.attachedFiles // Sync with backend attribute name
      }
    });
  } catch (error) {
    console.error('Failed to save conversation to backend:', error);
    // Fallback to localStorage for guest/offline
    const key = `conversations_${userId}`;
    const conversations = JSON.parse(localStorage.getItem(key) || '[]');
    const newConversation = { ...conversation, id: conversation.id || Date.now().toString(), savedAt: new Date().toISOString() };
    const index = conversations.findIndex(c => c.id === newConversation.id);
    if (index > -1) conversations[index] = newConversation;
    else conversations.push(newConversation);
    localStorage.setItem(key, JSON.stringify(conversations));
    return { success: true, data: newConversation, fallback: true };
  }
};

export const getConversations = async (userId) => {
  try {
    console.log('Fetching conversations from backend:', userId);
    const response = await apiRequest('/conversations');
    if (response.success) {
      // Merge with any local ones if needed, but primary is backend
      return response;
    }
    throw new Error('Backend fetch failed');
  } catch (error) {
    console.error('Failed to fetch conversations from backend:', error);
    const key = `conversations_${userId}`;
    const conversations = JSON.parse(localStorage.getItem(key) || '[]');
    return { success: true, data: conversations, fallback: true };
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    console.log('Deleting conversation:', conversationId);

    // Get user from localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.id) {
      const key = `conversations_${userData.id}`;
      const conversations = JSON.parse(localStorage.getItem(key) || '[]');
      const filteredConversations = conversations.filter(conv => conv.id !== conversationId);
      localStorage.setItem(key, JSON.stringify(filteredConversations));
    }

    return {
      success: true,
      message: 'Conversation deleted successfully',
      deletedId: conversationId
    };
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    throw error;
  }
};

// ========================
// File Upload Functions
// ========================

export const uploadFile = async (file, adminData) => {
  return await adminAPI.uploadDocument(file, adminData);
};

// ========================
// Health Check Functions
// ========================

export const healthAPI = {
  // System health check
  checkHealth: async () => {
    return await apiRequest('/health');
  },

  // Root endpoint
  getRoot: async () => {
    return await apiRequest('/');
  },

  // Test all endpoints
  testAllEndpoints: async () => {
    const results = {};

    try {
      results.root = await healthAPI.getRoot();
    } catch (error) {
      results.root = { success: false, error: error.message };
    }

    try {
      results.health = await healthAPI.checkHealth();
    } catch (error) {
      results.health = { success: false, error: error.message };
    }

    try {
      results.chat = await chatAPI.testConnection();
    } catch (error) {
      results.chat = { success: false, error: error.message };
    }

    return results;
  }
};



// ========================
// Support API Functions
// ========================

export const supportAPI = {
  // Submit new ticket
  submitTicket: async (ticketData) => {
    return await apiRequest('/support/ticket', {
      method: 'POST',
      body: ticketData
    });
  },

  // Get all tickets (Admin)
  getTickets: async (filter = null, page = 1, limit = 50) => {
    let url = `/admin/support/tickets?page=${page}&limit=${limit}`;
    if (filter) url += `&status_filter=${filter}`;
    return await apiRequest(url);
  },

  // Mark ticket as read (Admin)
  markAsRead: async (ticketId) => {
    return await apiRequest(`/admin/support/tickets/${ticketId}/read`, {
      method: 'PATCH'
    });
  },

  // Reply to ticket (Admin)
  replyToTicket: async (ticketId, replyData) => {
    return await apiRequest(`/admin/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: replyData
    });
  },

  // Delete ticket (Admin)
  deleteTicket: async (ticketId) => {
    return await apiRequest(`/admin/support/tickets/${ticketId}`, {
      method: 'DELETE'
    });
  }
};

// ========================
// Default Export with all APIs
// ========================

export default {
  chat: chatAPI,
  auth: authAPI,
  admin: adminAPI,
  health: healthAPI,
  support: supportAPI,
  saveConversation,
  getConversations,
  deleteConversation,
  uploadFile
};
