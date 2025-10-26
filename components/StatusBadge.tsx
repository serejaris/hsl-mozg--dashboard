import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { getBookingStatusMeta } from '@/lib/constants';

interface StatusBadgeProps {
  status: number | null;
  fallback?: ReactNode;
}

export default function StatusBadge({ status, fallback }: StatusBadgeProps) {
  if (status === undefined && fallback) {
    return <>{fallback}</>;
  }

  const meta = getBookingStatusMeta(status ?? null);

  if (!meta && fallback) {
    return <>{fallback}</>;
  }

  return (
    <Badge variant={meta.variant} className={meta.className}>
      {meta.label}
    </Badge>
  );
}
