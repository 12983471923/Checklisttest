import { useEffect } from 'react';
import { scheduleAutomaticBackups } from '../firebase/backup';
import { useAuth } from '../hooks/useAuth';

const useBackupScheduler = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('🔄 Initializing backup scheduler...');
    
    // Start automatic backup scheduling
    const cleanup = scheduleAutomaticBackups();

    // Cleanup function
    return () => {
      if (cleanup) {
        cleanup();
        console.log('🛑 Backup scheduler stopped');
      }
    };
  }, [isAuthenticated]);
};

export default useBackupScheduler;
