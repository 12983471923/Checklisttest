import React, { useState } from 'react';
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../hooks/useAuth';
import { logSecurityEvent } from '../utils/security';
import './ManualResetButton.css';

const ManualResetButton = ({ onResetComplete }) => {
  const { user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleManualReset = async () => {
    if (!user) {
      alert('You must be logged in to reset the checklist.');
      return;
    }

    setIsResetting(true);
    try {
      const sessionId = 'persistent-checklist-session';
      
      // Delete the main checklist session document
      const sessionRef = doc(db, 'checklists', sessionId);
      await deleteDoc(sessionRef);
      
      // Log the manual reset action
      await logSecurityEvent('manual_reset', {
        userId: user.id,
        username: user.username,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Manual reset completed by:', user.username);
      setShowConfirm(false);
      
      if (onResetComplete) {
        onResetComplete();
      }

      // Show success message
      setTimeout(() => {
        alert('✅ Checklist has been reset successfully!');
      }, 100);
      
    } catch (error) {
      console.error('❌ Manual reset failed:', error);
      alert('❌ Failed to reset checklist. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  // Only show to authorized users (managers and admins)
  if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="manual-reset-container">
      {!showConfirm ? (
        <button 
          className="manual-reset-btn"
          onClick={() => setShowConfirm(true)}
          disabled={isResetting}
          title="Reset all checklist data - this action cannot be undone"
        >
          🔄 Reset Checklist
        </button>
      ) : (
        <div className="reset-confirmation">
          <p>⚠️ Are you sure you want to reset all checklist data?</p>
          <p className="reset-warning">This will clear all completed tasks and cannot be undone.</p>
          <div className="confirmation-buttons">
            <button 
              className="confirm-reset-btn"
              onClick={handleManualReset}
              disabled={isResetting}
            >
              {isResetting ? '⏳ Resetting...' : '✅ Yes, Reset All'}
            </button>
            <button 
              className="cancel-reset-btn"
              onClick={() => setShowConfirm(false)}
              disabled={isResetting}
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualResetButton;
