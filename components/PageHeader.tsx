import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description?: string;
  lastUpdated?: Date | null;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
  actions?: ReactNode;
}

export default function PageHeader({
  lastUpdated,
  onRefresh,
  isRefreshing,
  actions
}: PageHeaderProps) {
  const timestamp = lastUpdated
    ? lastUpdated.toLocaleTimeString('ru-RU')
    : null;

  if (!timestamp && !actions && !onRefresh) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-muted-foreground">
      {timestamp && <div>Обновлено: {timestamp}</div>}
      {actions}
      {onRefresh && (
        <Button onClick={() => onRefresh()} disabled={!!isRefreshing} size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Обновить</span>
        </Button>
      )}
    </div>
  );
}
