import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './config';

// Export all checklist data for a specific date range
export const exportChecklistData = async (startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'checklists'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const data = [];
    
    querySnapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamps to regular dates for export
        date: doc.data().date?.toDate?.() || doc.data().date,
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        lastUpdated: doc.data().lastUpdated?.toDate?.() || doc.data().lastUpdated
      });
    });
    
    return data;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

// Export today's data as JSON file
export const downloadTodaysData = async () => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const data = await exportChecklistData(startOfDay, endOfDay);
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `checklist-backup-${today.toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading data:', error);
    alert('Error downloading data: ' + error.message);
  }
};

// Get statistics for a date range
export const getChecklistStats = async (startDate, endDate) => {
  try {
    const data = await exportChecklistData(startDate, endDate);
    
    const stats = {
      totalSessions: data.length,
      byShift: { Night: 0, Morning: 0, Evening: 0 },
      completionRates: [],
      averageCompletion: 0
    };
    
    data.forEach(session => {
      stats.byShift[session.shift] = (stats.byShift[session.shift] || 0) + 1;
      
      if (session.tasks && session.tasks.length > 0) {
        const completed = session.tasks.filter(task => task.completed).length;
        const total = session.tasks.length;
        const rate = (completed / total) * 100;
        stats.completionRates.push(rate);
      }
    });
    
    if (stats.completionRates.length > 0) {
      stats.averageCompletion = stats.completionRates.reduce((a, b) => a + b, 0) / stats.completionRates.length;
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
};
