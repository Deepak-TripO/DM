import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveTasks } from '@/services/taskService';
import { FinanceView } from '@/pages/finance/FinanceView';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasFinanceAccess, setHasFinanceAccess] = useState(false);
  const [financeTask, setFinanceTask] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function checkFinancePermission() {
      try {
        const tasks = await getActiveTasks();
        if (!isMounted) return;

        const foundFinance = tasks.find(
          (t) => t.name.trim().toLowerCase() === 'finance'
        );

        if (foundFinance) {
          setHasFinanceAccess(true);
          setFinanceTask(foundFinance);
        } else {
          setHasFinanceAccess(false);
          navigate('/tasks', { replace: true });
        }
      } catch {
        if (isMounted) {
          setHasFinanceAccess(false);
          navigate('/tasks', { replace: true });
        }
      } finally {
        if (isMounted) setCheckingAccess(false);
      }
    }

    checkFinancePermission();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (checkingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!hasFinanceAccess) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <FinanceView task={financeTask} />
    </div>
  );
}
