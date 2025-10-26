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
  title,
  description,
  lastUpdated,
  onRefresh,
  isRefreshing,
  actions
}: PageHeaderProps) {
  const timestamp = lastUpdated
    ? lastUpdated.toLocaleTimeString('ru-RU')
    : null;

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {timestamp && (
          <div className="text-sm text-muted-foreground">
            Обновлено: {timestamp}
          </div>
        )}
        {actions}
        {onRefresh && (
          <Button onClick={() => onRefresh()} disabled={!!isRefreshing} size="sm">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="ml-2">Обновить</span>
          </Button>
        )}
      </div>
    </div>
  );
}
