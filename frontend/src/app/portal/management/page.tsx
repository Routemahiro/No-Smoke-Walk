'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAdmin, loading, initialized, signIn, signInLoading, signInError, clearSignInError } = useAuth();
  const [email, setEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Redirect if already authenticated admin
  if (initialized && user && isAdmin) {
    router.push('/portal/management/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return;
    }

    try {
      await signIn(email.trim());
      setShowSuccess(true);
      setEmail('');
    } catch (error) {
      // Error is handled by useAuth hook
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (signInError) {
      clearSignInError();
    }
    if (showSuccess) {
      setShowSuccess(false);
    }
  };

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                ホームに戻る
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🔐 管理者ログイン
                </h1>
                <p className="text-sm text-gray-600">
                  大阪市指導員向け管理システム
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>管理者認証</CardTitle>
            <CardDescription>
              登録済みの管理者メールアドレスを入力してください。<br />
              ログインリンクをメールで送信します。
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  disabled={signInLoading}
                  className="w-full"
                />
              </div>

              {signInError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{signInError}</AlertDescription>
                </Alert>
              )}

              {showSuccess && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ログインリンクをメールで送信しました。メールをご確認ください。
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={signInLoading || !email.trim()}
              >
                {signInLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    送信中...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    ログインリンクを送信
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  管理者権限について
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 事前に登録されたメールアドレスのみログイン可能</li>
                  <li>• メールリンクによるセキュアな認証方式</li>
                  <li>• 報告データの閲覧・エクスポートが可能</li>
                  <li>• 不正アクセス防止のため定期的にセッション期限が切れます</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>© 2025 No-Smoke Walk Osaka. 大阪市路上喫煙対策の一環として運営されています。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}