export function formatMessageTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatListTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return formatMessageTime(ts);
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function messageViewLabel(view) {
  if (view === 'archived') return 'Archived';
  if (view === 'trash') return 'Trash';
  if (view === 'all') return 'All messages';
  return 'online';
}

export const QUICK_EMOJIS = ['👍', '❤️', '😊', '🙏', '✅', '🏨', '🛏️', '🧹'];
