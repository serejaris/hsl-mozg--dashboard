import { Badge } from '@/components/ui/badge';
import { getStreamName } from '@/lib/constants';

interface StreamBadgeProps {
  stream?: string | null;
}

export default function StreamBadge({ stream }: StreamBadgeProps) {
  if (!stream) {
    return <Badge variant="outline">—</Badge>;
  }

  return (
    <Badge variant="secondary">
      {getStreamName(stream)}
    </Badge>
  );
}
