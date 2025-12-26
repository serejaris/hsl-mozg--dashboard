import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend
}: MetricCardProps) {
  return (
    <Card className="border-border/60 bg-card shadow-none">
      <CardHeader className="space-y-1 pb-0">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between px-4 pb-1 pt-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardContent>
      {(description || trend) && (
        <CardContent className="px-4 pb-3 pt-0">
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className="flex items-center gap-2 pt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
