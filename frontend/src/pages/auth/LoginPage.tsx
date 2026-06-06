import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setError('');
      const { user, token } = await authApi.login(data.email, data.password);
      setAuth(user, token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col justify-center items-center p-4">
      <Link to="/" className="mb-8 flex items-center space-x-2">
        <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-lg leading-none">V</span>
        </div>
        <span className="text-2xl font-bold tracking-tight text-primary">VendorBridge</span>
      </Link>
      
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <p className="text-sm text-muted-foreground">Enter your email and password to access your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md text-center font-medium">
                {error}
              </div>
            )}
            
            <Input 
              label="Email" 
              placeholder="admin@vendorbridge.com" 
              {...register('email')} 
              error={errors.email?.message} 
            />
            
            <div className="space-y-1">
              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••" 
                {...register('password')} 
                error={errors.password?.message} 
              />
              <div className="flex justify-end pt-1">
                <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>
            
            <Button type="submit" className="w-full mt-6" isLoading={isSubmitting}>
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3 font-semibold uppercase tracking-wider">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-secondary p-2 rounded border border-border">admin@vendorbridge.com</div>
              <div className="bg-secondary p-2 rounded border border-border">procurement@vendorbridge.com</div>
              <div className="bg-secondary p-2 rounded border border-border">manager@vendorbridge.com</div>
              <div className="bg-secondary p-2 rounded border border-border">vendor1@techsupply.com</div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">(Any password works)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
