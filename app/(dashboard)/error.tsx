'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error caught:', error);
  }, [error]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <Card className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Failed to load dashboard content</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          We encountered an error loading this section. Your account data is safe.
        </p>
        <Button onClick={() => reset()} variant="default">
          Try again
        </Button>
      </Card>
    </div>
  );
}
