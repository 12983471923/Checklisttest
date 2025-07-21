import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  where
} from 'firebase/firestore';
import { db } from './config';
import { logSecurityEvent } from '../utils/security';

// Backup configuration
const BACKUP_CONFIG = {
  maxBackups: 30, // Keep 30 days of backups
  compressionLevel: 'medium',
  includeMetadata: true,
  collections: [
    'checklists',
    'downtime', 
    'handoverNotes',
    'wakeUpCalls',
    'breakfastTimes',
    'users',
    'auditTrail'
  ]
};

// Create a backup of all data
export const createBackup = async (triggeredBy = 'system', backupType = 'automatic') => {
  const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date();
  
  try {
    console.log(`🔄 Starting ${backupType} backup...`);
    
    const backupData = {
      id: backupId,
      timestamp: serverTimestamp(),
      triggeredBy,
      type: backupType,
      status: 'in_progress',
      collections: {},
      metadata: {
        version: '2.0',
        totalDocuments: 0,
        totalSize: 0,
        duration: null,
        error: null
      }
    };

    // Backup each collection
    let totalDocs = 0;
    let totalSize = 0;

    for (const collectionName of BACKUP_CONFIG.collections) {
      try {
        console.log(`📦 Backing up collection: ${collectionName}`);
        
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        const documents = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          documents[doc.id] = {
            data,
            metadata: {
              id: doc.id,
              path: doc.ref.path,
              lastModified: data.updatedAt || data.createdAt || timestamp
            }
          };
          
          // Estimate size (rough calculation)
          totalSize += JSON.stringify(data).length;
          totalDocs++;
        });

        backupData.collections[collectionName] = {
          documentCount: snapshot.docs.length,
          documents,
          backupTime: timestamp.toISOString()
        };

        console.log(`✅ ${collectionName}: ${snapshot.docs.length} documents`);
      } catch (error) {
        console.error(`❌ Error backing up ${collectionName}:`, error);
        backupData.collections[collectionName] = {
          error: error.message,
          backupTime: timestamp.toISOString()
        };
      }
    }

    // Update metadata
    const endTime = new Date();
    backupData.metadata.totalDocuments = totalDocs;
    backupData.metadata.totalSize = totalSize;
    backupData.metadata.duration = endTime - timestamp;
    backupData.status = 'completed';

    // Save backup to Firestore
    const backupRef = doc(db, 'backups', backupId);
    await setDoc(backupRef, backupData);

    // Clean up old backups
    await cleanupOldBackups();

    logSecurityEvent('backup_created', {
      backupId,
      type: backupType,
      triggeredBy,
      documentsCount: totalDocs,
      duration: backupData.metadata.duration
    });

    console.log(`✅ Backup completed: ${backupId}`);
    console.log(`📊 ${totalDocs} documents, ${(totalSize / 1024).toFixed(2)} KB, ${backupData.metadata.duration}ms`);

    return { 
      success: true, 
      backupId, 
      metadata: backupData.metadata,
      error: null 
    };

  } catch (error) {
    console.error('❌ Backup failed:', error);
    
    logSecurityEvent('backup_failed', {
      backupId,
      type: backupType,
      triggeredBy,
      error: error.message
    });

    // Try to save error state
    try {
      const backupRef = doc(db, 'backups', backupId);
      await setDoc(backupRef, {
        id: backupId,
        timestamp: serverTimestamp(),
        triggeredBy,
        type: backupType,
        status: 'failed',
        error: error.message,
        metadata: {
          version: '2.0',
          totalDocuments: 0,
          totalSize: 0,
          duration: null,
          error: error.message
        }
      });
    } catch (saveError) {
      console.error('Failed to save backup error state:', saveError);
    }

    return { 
      success: false, 
      backupId, 
      error: error.message 
    };
  }
};

// Get list of all backups
export const getBackupsList = async () => {
  try {
    const backupsRef = collection(db, 'backups');
    const q = query(backupsRef, orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    
    const backups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { backups, error: null };
  } catch (error) {
    console.error('Error getting backups list:', error);
    return { backups: [], error: error.message };
  }
};

// Get specific backup details
export const getBackupDetails = async (backupId) => {
  try {
    const backupRef = doc(db, 'backups', backupId);
    const backupSnap = await getDoc(backupRef);
    
    if (!backupSnap.exists()) {
      return { backup: null, error: 'Backup not found' };
    }

    const backup = { id: backupSnap.id, ...backupSnap.data() };
    return { backup, error: null };
  } catch (error) {
    console.error('Error getting backup details:', error);
    return { backup: null, error: error.message };
  }
};

// Restore data from backup
export const restoreFromBackup = async (backupId, options = {}) => {
  const { 
    selectedCollections = BACKUP_CONFIG.collections,
    confirmRestore = false,
    restoreMode = 'replace' // 'replace', 'merge', 'skip_existing'
  } = options;

  if (!confirmRestore) {
    throw new Error('Restore must be explicitly confirmed');
  }

  try {
    console.log(`🔄 Starting restore from backup: ${backupId}`);
    
    // Get backup data
    const { backup, error } = await getBackupDetails(backupId);
    if (error || !backup) {
      throw new Error(`Backup not found: ${error}`);
    }

    if (backup.status !== 'completed') {
      throw new Error(`Cannot restore from incomplete backup (status: ${backup.status})`);
    }

    const batch = writeBatch(db);
    let restoredDocs = 0;
    const restoreLog = {
      collections: {},
      totalRestored: 0,
      errors: []
    };

    // Restore each selected collection
    for (const collectionName of selectedCollections) {
      if (!backup.collections[collectionName]) {
        console.log(`⚠️ Collection ${collectionName} not found in backup, skipping`);
        continue;
      }

      const collectionBackup = backup.collections[collectionName];
      if (collectionBackup.error) {
        console.log(`⚠️ Collection ${collectionName} had backup error, skipping`);
        restoreLog.errors.push(`${collectionName}: ${collectionBackup.error}`);
        continue;
      }

      console.log(`📦 Restoring collection: ${collectionName}`);
      
      const documents = collectionBackup.documents || {};
      let collectionRestored = 0;

      for (const [docId, docData] of Object.entries(documents)) {
        try {
          const docRef = doc(db, collectionName, docId);
          
          if (restoreMode === 'skip_existing') {
            const existingDoc = await getDoc(docRef);
            if (existingDoc.exists()) {
              continue;
            }
          }

          // Prepare document data (remove Firestore metadata)
          const cleanData = { ...docData.data };
          
          // Convert timestamp fields back to serverTimestamp for consistency
          Object.keys(cleanData).forEach(key => {
            if (cleanData[key] && typeof cleanData[key] === 'object' && cleanData[key].seconds) {
              // This is a Firestore timestamp, convert it back
              cleanData[key] = new Date(cleanData[key].seconds * 1000);
            }
          });

          batch.set(docRef, cleanData, { merge: restoreMode === 'merge' });
          collectionRestored++;
          restoredDocs++;

        } catch (docError) {
          console.error(`Error restoring document ${docId}:`, docError);
          restoreLog.errors.push(`${collectionName}/${docId}: ${docError.message}`);
        }
      }

      restoreLog.collections[collectionName] = {
        attempted: Object.keys(documents).length,
        restored: collectionRestored,
        errors: restoreLog.errors.filter(e => e.startsWith(collectionName)).length
      };

      console.log(`✅ ${collectionName}: ${collectionRestored} documents restored`);
    }

    // Commit all changes
    await batch.commit();
    
    restoreLog.totalRestored = restoredDocs;

    // Log the restore operation
    logSecurityEvent('backup_restored', {
      backupId,
      selectedCollections,
      restoreMode,
      totalRestored: restoredDocs,
      errors: restoreLog.errors.length
    });

    console.log(`✅ Restore completed: ${restoredDocs} documents restored`);
    
    return { 
      success: true, 
      restored: restoredDocs,
      log: restoreLog,
      error: null 
    };

  } catch (error) {
    console.error('❌ Restore failed:', error);
    
    logSecurityEvent('backup_restore_failed', {
      backupId,
      error: error.message
    });

    return { 
      success: false, 
      restored: 0,
      error: error.message 
    };
  }
};

// Export data as JSON
export const exportBackupAsJSON = async (backupId) => {
  try {
    const { backup, error } = await getBackupDetails(backupId);
    if (error || !backup) {
      throw new Error(`Backup not found: ${error}`);
    }

    // Create exportable data structure
    const exportData = {
      exportInfo: {
        backupId,
        exportDate: new Date().toISOString(),
        originalBackupDate: backup.timestamp,
        version: backup.metadata?.version || '2.0',
        source: 'Scandic Falkoner Checklist System'
      },
      collections: {}
    };

    // Process each collection
    Object.entries(backup.collections).forEach(([collectionName, collectionData]) => {
      if (collectionData.documents) {
        exportData.collections[collectionName] = Object.entries(collectionData.documents).map(([docId, docData]) => ({
          id: docId,
          ...docData.data
        }));
      }
    });

    logSecurityEvent('backup_exported', { backupId, format: 'json' });

    return { 
      success: true, 
      data: exportData,
      filename: `hotel-checklist-backup-${backup.id}-${new Date().toISOString().split('T')[0]}.json`,
      error: null 
    };

  } catch (error) {
    console.error('Error exporting backup:', error);
    return { 
      success: false, 
      data: null,
      error: error.message 
    };
  }
};

// Clean up old backups (keep only last N backups)
export const cleanupOldBackups = async () => {
  try {
    const backupsRef = collection(db, 'backups');
    const q = query(backupsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.docs.length <= BACKUP_CONFIG.maxBackups) {
      return { deleted: 0, error: null };
    }

    const backupsToDelete = snapshot.docs.slice(BACKUP_CONFIG.maxBackups);
    const batch = writeBatch(db);
    
    backupsToDelete.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    logSecurityEvent('backups_cleaned', { 
      deleted: backupsToDelete.length,
      remaining: BACKUP_CONFIG.maxBackups 
    });

    console.log(`🧹 Cleaned up ${backupsToDelete.length} old backups`);
    
    return { deleted: backupsToDelete.length, error: null };
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
    return { deleted: 0, error: error.message };
  }
};

// Delete specific backup
export const deleteBackup = async (backupId) => {
  try {
    const backupRef = doc(db, 'backups', backupId);
    const backupSnap = await getDoc(backupRef);
    
    if (!backupSnap.exists()) {
      return { success: false, error: 'Backup not found' };
    }

    await backupRef.delete();

    logSecurityEvent('backup_deleted', { backupId });

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting backup:', error);
    return { success: false, error: error.message };
  }
};

// Schedule automatic backups (call this on app initialization)
export const scheduleAutomaticBackups = () => {
  // Check if we should create a backup
  const checkBackupNeeded = async () => {
    try {
      const today = new Date().toDateString();
      const backupsRef = collection(db, 'backups');
      const todayQuery = query(
        backupsRef, 
        where('type', '==', 'automatic'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(todayQuery);
      
      if (snapshot.empty) {
        console.log('📅 No backup found for today, creating automatic backup...');
        await createBackup('system', 'automatic');
        return;
      }

      const lastBackup = snapshot.docs[0].data();
      const lastBackupDate = new Date(lastBackup.timestamp.seconds * 1000).toDateString();
      
      if (lastBackupDate !== today) {
        console.log('📅 Last backup was not today, creating automatic backup...');
        await createBackup('system', 'automatic');
      } else {
        console.log('✅ Automatic backup already exists for today');
      }
    } catch (error) {
      console.error('Error checking backup status:', error);
    }
  };

  // Check immediately
  checkBackupNeeded();

  // Set up daily check (every 24 hours)
  const dailyBackupCheck = setInterval(checkBackupNeeded, 24 * 60 * 60 * 1000);

  // Return cleanup function
  return () => {
    clearInterval(dailyBackupCheck);
  };
};
