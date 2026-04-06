import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a recovery session
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setValid(true);
    }
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValid(true);
      }
    });
  }, []);

  const handleReset = async () => {
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated!', description: 'You can now login with your new password.' });
      navigate('/auth');
    }
  };

  if (!valid) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Invalid or expired reset link.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Lock className="mx-auto h-10 w-10 text-primary" />
          <CardTitle className="font-serif text-2xl">Set New Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>New Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
          </div>
          <Button className="w-full" onClick={handleReset} disabled={loading}>
            {loading ? 'Updating…' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
