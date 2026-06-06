import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-9xl font-extrabold text-primary/10">404</h1>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Page Not Found</h2>
        <p className="text-muted-foreground">The page you are looking for does not exist or has been moved.</p>
        <Link to="/dashboard">
          <Button className="mt-4">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
