import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const CreateBrandPage = () => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleSubmit = async () => {
    if (!name || !slug) {
      toast({ title: 'Please fill in name and slug', variant: 'destructive' });
      return;
    }
    if (!user) return;

    setSaving(true);
    const { error } = await supabase.from('brands').insert({
      name,
      slug,
      logo_url: logoUrl,
      owner_id: user.id,
    } as any);
    setSaving(false);

    if (error) {
      if (error.message.includes('duplicate')) {
        toast({ title: 'Slug already taken', description: 'Please choose a different slug.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['my-brand'] });
    toast({ title: 'Brand created! 🎉' });
    navigate('/admin');
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <Store className="mx-auto h-10 w-10 text-primary" />
            <CardTitle className="font-serif text-2xl">Create Your Restaurant</CardTitle>
            <p className="text-sm text-muted-foreground">Set up your brand to start receiving orders</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Restaurant Name</Label>
              <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Mama's Kitchen" />
            </div>
            <div>
              <Label>URL Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="mamas-kitchen" />
              <p className="mt-1 text-xs text-muted-foreground">
                Your menu will be at: yoursite.com/{slug || 'your-slug'}
              </p>
            </div>
            <div>
              <Label>Logo URL (optional)</Label>
              <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
            </div>
            <Button onClick={handleSubmit} disabled={saving} className="w-full">
              {saving ? 'Creating…' : 'Create Restaurant'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateBrandPage;
