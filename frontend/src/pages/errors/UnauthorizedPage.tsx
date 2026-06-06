import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';

export default function UnauthorizedPage() {
  const { user, logout } = useAuthStore();
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">Access Denied</h2>
        <p className="text-muted-foreground">
          Your current role (<span className="font-semibold text-foreground">{user?.role}</span>) does not have permission to view this page.
        </p>
        <div className="flex items-center justify-center space-x-4 pt-4">
          <Link to="/dashboard">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
          <Button onClick={() => logout()}>Logout</Button>
        </div>
      </div>
    </div>
  );
}
