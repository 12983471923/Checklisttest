import { useCallback, useEffect, useState } from 'react';
import {
  subscribeHskChecklist,
  updateHskChecklistTasks,
  ensureHskChecklist,
} from '../firebase/hsk';

export function useHskChecklist() {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    ensureHskChecklist().catch(console.error);
    const unsub = subscribeHskChecklist((data) => {
      if (mounted) {
        setChecklist(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const toggleTask = useCallback(
    async (taskId) => {
      if (!checklist?.tasks) return;
      const tasks = checklist.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      await updateHskChecklistTasks(tasks);
    },
    [checklist]
  );

  const completedCount = checklist?.tasks?.filter((t) => t.completed).length ?? 0;
  const totalCount = checklist?.tasks?.length ?? 0;

  return { checklist, loading, toggleTask, completedCount, totalCount };
}
