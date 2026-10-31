import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth.store';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { authApi, type CaptchaResponse } from '@/api/auth.api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState<CaptchaResponse | null>(null);
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const login = useLogin();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  // 验证码一次性（用后即失效），因此进入页面、点击图片、登录失败后都要重新拉取
  const refreshCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    setCaptchaCode('');
    try {
      const data = await authApi.getCaptcha();
      setCaptcha(data);
    } catch {
      setCaptcha(null);
      toast.error('验证码加载失败，请点击图片重试。');
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCaptcha();
  }, [refreshCaptcha]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const code = captchaCode.trim().toUpperCase();
    if (!code) {
      toast.error('请输入验证码');
      return;
    }
    if (!captcha?.id) {
      toast.error('验证码加载失败，请点击图片刷新后重试');
      void refreshCaptcha();
      return;
    }

    login.mutate(
      { username, password, captchaId: captcha.id, captchaCode: code },
      {
        onError: (err: unknown) => {
          // 验证码错误 / 账号密码错误都走这里：优先展示后端文案
          const axiosError = err as { response?: { data?: { error?: string } } };
          setErrorMessage(axiosError?.response?.data?.error || '登录失败，请重试。');
          // 无论为何失败，验证码都已被消费，必须换一张
          void refreshCaptcha();
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background grid-bg">
      {/* Ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm mx-4 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <span className="text-primary font-bold text-xl font-mono-data text-glow">TS</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">TeamSpeak 6 管理器</h1>
          <p className="text-sm text-muted-foreground mt-1">服务器管理面板</p>
        </div>

        <Card className="border-border/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <h2 className="text-sm font-medium text-center text-muted-foreground">登录以继续</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs">用户名</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="captchaCode" className="text-xs">验证码</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="captchaCode"
                    value={captchaCode}
                    onChange={(e) => setCaptchaCode(e.target.value.toUpperCase())}
                    placeholder="验证码"
                    autoComplete="off"
                    maxLength={5}
                    className="font-mono-data tracking-[0.3em] uppercase"
                  />
                  <button
                    type="button"
                    onClick={() => void refreshCaptcha()}
                    title="点击刷新验证码"
                    aria-label="点击刷新验证码"
                    className="h-9 w-[100px] shrink-0 cursor-pointer rounded-md border border-input bg-transparent overflow-hidden flex items-center justify-center transition-colors hover:border-primary/50"
                  >
                    {captcha ? (
                      <img
                        src={captcha.image}
                        alt="验证码"
                        className="h-9 w-full object-cover select-none"
                        draggable={false}
                      />
                    ) : (
                      <RefreshCw
                        className={`h-4 w-4 text-muted-foreground ${captchaLoading ? 'animate-spin' : ''}`}
                      />
                    )}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 rounded-md px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={login.isPending || !username || !password}
              >
                {login.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-6 font-mono-data">
          TS6 WEBUI v1.0.0
        </p>
      </div>

      {/* 登录页在 AppLayout 之外，需自备 Toaster 才能显示 toast 提示 */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-popover text-popover-foreground border-border',
        }}
      />
    </div>
  );
}
