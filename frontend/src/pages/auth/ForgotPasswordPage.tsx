import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

type Step = 'email' | 'otp' | 'password';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetError = () => {
    setError('');
  };

  const handleCancel = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const onSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    handleResetError();
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('OTP must be exactly 6 digits');
      return;
    }
    handleResetError();
    setIsLoading(true);
    try {
      await authApi.verifyOtp(email, otp);
      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    handleResetError();
    setIsLoading(true);
    try {
      await authApi.resetPassword(email, otp, newPassword);
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
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
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md text-center font-medium">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={onSubmitEmail} className="space-y-4">
              <Input 
                label="Email" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
                Request OTP
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={onSubmitOtp} className="space-y-4">
              <Input 
                label="Enter 6-Digit OTP" 
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
                Verify OTP
              </Button>
              <Button type="button" variant="outline" className="w-full mt-2" onClick={handleCancel}>
                Cancel
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={onSubmitPassword} className="space-y-4">
              <Input 
                label="New Password" 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input 
                label="Confirm New Password" 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button type="submit" className="w-full mt-6" isLoading={isLoading}>
                Reset Password
              </Button>
              <Button type="button" variant="outline" className="w-full mt-2" onClick={handleCancel}>
                Cancel
              </Button>
            </form>
          )}
          
          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="text-primary font-medium hover:underline">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
