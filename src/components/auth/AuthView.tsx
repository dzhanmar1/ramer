import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useI18nStore } from '../../store/i18nStore';

export const AuthView = () => {
  const t = useI18nStore(state => state.t);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = isLogin 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-slate-800">
            {isLogin ? t('auth.login') : t('auth.register')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.password')}</Label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '...' : isLogin ? t('auth.login') : t('auth.register')}
            </Button>
            <Button 
              type="button" 
              variant="link" 
              className="w-full" 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? t('auth.btn_register') : t('auth.btn_login')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
