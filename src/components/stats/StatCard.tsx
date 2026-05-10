"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: LucideIcon;
  loading?: boolean;
  className?: string;
  iconClassName?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  loading,
  className,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          <div className={cn("rounded-md p-1.5 bg-primary/10", iconClassName)}>
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-7 w-32 mb-1" />
            <Skeleton className="h-4 w-20" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
