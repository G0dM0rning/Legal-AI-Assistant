import { useState, useCallback, useEffect } from 'react';
import { adminAPI } from '../services/api';

/**
 * Custom hook to poll and manage system status.
 */
export const useSystemStatus = (pollingInterval = 30000) => {
    const [systemStatus, setSystemStatus] = useState({ database: 'checking', ai: 'checking' });

    const fetchSystemStatus = useCallback(async () => {
        try {
            const response = await adminAPI.getSystemStatus();
            if (response.success) {
                setSystemStatus({
                    database: response.data.system?.status === 'operational' ? 'connected' : 'disconnected',
                    ai: (response.data.ai_providers?.llm?.status === 'active' || response.data.ai_providers?.llm?.status === 'ready') ? 'ready' : 'offline'
                });
            }
        } catch (e) {
            console.error('Error fetching system status:', e);
            setSystemStatus({ database: 'disconnected', ai: 'offline' });
        }
    }, []);

    useEffect(() => {
        fetchSystemStatus();
        const interval = setInterval(fetchSystemStatus, pollingInterval);
        return () => clearInterval(interval);
    }, [fetchSystemStatus, pollingInterval]);

    return { systemStatus, fetchSystemStatus };
};
