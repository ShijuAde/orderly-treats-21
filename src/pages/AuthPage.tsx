import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEmailSignup = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Check your email!', description: 'We sent a verification link to confirm your account.' });
    }
  };

  const handleEmailLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome back!' });
      navigate('/');
    }
  };

  const handlePhoneOtp = async () => {
    setLoading(true);
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        phone,
        password,
        options: { data: { full_name: fullName } },
      });
      setLoading(false);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setOtpSent(true);
        toast({ title: 'OTP sent!', description: 'Check your phone for the verification code.' });
      }
    } else {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      setLoading(false);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setOtpSent(true);
        toast({ title: 'OTP sent!', description: 'Check your phone for the login code.' });
      }
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: mode === 'signup' ? 'sms' : 'sms',
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Verification failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome!' });
      navigate('/');
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({ title: 'Enter your email', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Check your email', description: 'Password reset link sent!' });
      setResetMode(false);
    }
  };

  if (resetMode) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Mail className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="font-serif text-2xl">Reset Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <Button className="w-full" onClick={handlePasswordReset} disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setResetMode(false)}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <User className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="font-serif text-2xl">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toggle login/signup */}
            <div className="flex gap-2">
              <Button variant={mode === 'login' ? 'default' : 'outline'} className="flex-1" onClick={() => { setMode('login'); setOtpSent(false); }}>
                Login
              </Button>
              <Button variant={mode === 'signup' ? 'default' : 'outline'} className="flex-1" onClick={() => { setMode('signup'); setOtpSent(false); }}>
                Sign Up
              </Button>
            </div>

            {/* Auth method tabs */}
            <Tabs value={authMethod} onValueChange={(v) => { setAuthMethod(v as any); setOtpSent(false); }}>
              <TabsList className="w-full">
                <TabsTrigger value="email" className="flex-1 gap-1"><Mail className="h-3 w-3" /> Email</TabsTrigger>
                <TabsTrigger value="phone" className="flex-1 gap-1"><Phone className="h-3 w-3" /> Phone</TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-3 mt-4">
                {mode === 'signup' && (
                  <div>
                    <Label>Full Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
                  </div>
                )}
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
                </div>
                <div>
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={loading}
                  onClick={mode === 'signup' ? handleEmailSignup : handleEmailLogin}
                >
                  {loading ? 'Please wait…' : mode === 'signup' ? 'Sign Up' : 'Login'}
                </Button>
                {mode === 'login' && (
                  <Button variant="link" className="w-full text-sm" onClick={() => setResetMode(true)}>
                    Forgot password?
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="phone" className="space-y-3 mt-4">
                {mode === 'signup' && !otpSent && (
                  <div>
                    <Label>Full Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
                  </div>
                )}
                {!otpSent ? (
                  <>
                    <div>
                      <Label>Phone Number</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." />
                    </div>
                    {mode === 'signup' && (
                      <div>
                        <Label>Password</Label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                      </div>
                    )}
                    <Button className="w-full" disabled={loading} onClick={handlePhoneOtp}>
                      {loading ? 'Sending…' : 'Send OTP'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Enter OTP</Label>
                      <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" maxLength={6} />
                    </div>
                    <Button className="w-full" disabled={loading} onClick={handleVerifyOtp}>
                      {loading ? 'Verifying…' : 'Verify OTP'}
                    </Button>
                    <Button variant="ghost" className="w-full text-sm" onClick={() => setOtpSent(false)}>
                      Resend OTP
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthPage;
