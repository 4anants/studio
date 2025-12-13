
'use client'

import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'


const MicrosoftLogo = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.19151 9.19151H0V0H9.19151V9.19151Z" fill="#F25022" />
    <path d="M20 9.19151H10.8085V0H20V9.19151Z" fill="#7FBA00" />
    <path d="M9.19151 20H0V10.8085H9.19151V20Z" fill="#00A4EF" />
    <path d="M20 20H10.8085V10.8085H20V20Z" fill="#FFB900" />
  </svg>
)

export function LoginForm() {
  const router = useRouter()
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast()
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const targetRole = session.user.role || 'employee';

      toast({
        title: 'Login Successful',
        description: `Welcome, ${session.user.name}!`,
      });

      router.push(`/dashboard?role=${targetRole}`);
    }
  }, [status, session, router, toast]);

  async function handleLocalLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid email or password.',
        });
      } else {
        // Successful login will trigger session update in useEffect
        // But we can also redirect here if needed, 
        // though session affect is cleaner.
        // Wait, the useEffect handles redirection based on session status.
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithMicrosoft() {
    setIsLoading(true);
    // This will redirect the user to the Microsoft login page
    await signIn('azure-ad', { callbackUrl: '/dashboard' });
  }

  const isPageLoading = status === 'loading' || isLoading;

  return (
    <>
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your Microsoft account or email to sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={signInWithMicrosoft} variant="outline" className="w-full" disabled={isPageLoading}>
            {isPageLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MicrosoftLogo />
            )}
            <span className="ml-2">Sign in with Microsoft</span>
          </Button>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <form onSubmit={handleLocalLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPageLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPageLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPageLoading}>
                {isPageLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
