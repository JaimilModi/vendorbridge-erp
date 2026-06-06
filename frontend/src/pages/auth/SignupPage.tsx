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

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  companyName: z.string().optional(),
  gstin: z.string().optional(),
  category: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'procurement_officer', 'vendor', 'manager'], {
    required_error: 'Please select a role',
  }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: setAuth } = useAuthStore();
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema)
  });
  
  const selectedRole = watch('role');

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setError('');
      const { user, token } = await authApi.signup({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role as any,
        companyName: data.companyName,
        gstin: data.gstin,
        category: data.category,
        address: data.address
      });
      setAuth(user, token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col justify-center items-center p-4 py-12">
      <Link to="/" className="mb-8 flex items-center space-x-2">
        <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-lg leading-none">V</span>
        </div>
        <span className="text-2xl font-bold tracking-tight text-primary">VendorBridge</span>
      </Link>
      
      <Card className="w-full max-w-lg shadow-soft">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-2xl font-bold">Register Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md text-center font-medium">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Full Name" 
                {...register('fullName')} 
                error={errors.fullName?.message} 
              />
              <Input 
                label="Company Name (Vendors Only)" 
                {...register('companyName')} 
                error={errors.companyName?.message} 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">Account Role</label>
              <select 
                {...register('role')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a role...</option>
                <option value="admin">System Admin</option>
                <option value="procurement_officer">Procurement Officer</option>
                <option value="manager">Manager / Approver</option>
                <option value="vendor">Vendor / Supplier</option>
              </select>
              {errors.role && <p className="text-sm font-medium text-destructive">{errors.role.message}</p>}
            </div>

            {selectedRole === 'vendor' && (
              <div className="space-y-4 p-4 border border-border rounded-md bg-muted/20">
                <h4 className="font-semibold text-sm">Vendor Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="GSTIN" 
                    {...register('gstin')} 
                    error={errors.gstin?.message} 
                  />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium leading-none">Category</label>
                    <select 
                      {...register('category')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select category...</option>
                      <option value="IT Equipment">IT Equipment</option>
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Software">Software</option>
                      <option value="Services">Services</option>
                    </select>
                  </div>
                </div>
                <Input 
                  label="Business Address" 
                  {...register('address')} 
                  error={errors.address?.message} 
                />
              </div>
            )}
            
            <Input 
              label="Email" 
              type="email"
              {...register('email')} 
              error={errors.email?.message} 
            />
            
            <Input 
              label="Password" 
              type="password" 
              {...register('password')} 
              error={errors.password?.message} 
            />
            
            <Button type="submit" className="w-full mt-6" isLoading={isSubmitting}>
              Create Account
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
