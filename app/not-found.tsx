import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground text-center">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-6xl font-extrabold text-primary">404</h1>
        <h2 className="text-2xl font-bold tracking-tight">Page Not Found</h2>
        <p className="text-muted-foreground text-sm">
          The page or record you are looking for does not exist or may have been moved.
        </p>
        <div className="pt-2">
          <Link href="/overview">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
