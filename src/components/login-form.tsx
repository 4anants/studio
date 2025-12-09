
'use client'

import { useRouter } from 'next/navigation'

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
import { users as initialUsers, User } from '@/lib/mock-data'

const MicrosoftLogo = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.19151 9.19151H0V0H9.19151V9.19151Z" fill="#F25022"/>
        <path d="M20 9.19151H10.8085V0H20V9.19151Z" fill="#7FBA00"/>
        <path d="M9.19151 20H0V10.8085H9.19151V20Z" fill="#00A4EF"/>
        <path d="M20 20H10.8085V10.8085H20V20Z" fill="#FFB900"/>
    </svg>
)

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState(initialUsers)
  const { toast } = useToast()
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    localStorage.removeItem('session');
    const storedDomains = localStorage.getItem('allowedDomains');
    if (storedDomains) {
      setAllowedDomains(JSON.parse(storedDomains));
    } else {
        setAllowedDomains(['yourdomain.com']);
    }
  }, []);

  const handleNewUser = (user: { uid: string, email?: string | null, displayName?: string | null }) => {
    if (user.email && !users.some(u => u.email === user.email)) {
        const newUser: User = {
            id: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            status: 'active',
            role: 'employee',
            avatar: String(Date.now()),
        };
        setUsers(prev => [...prev, newUser]);
    }
  };

  async function handleLocalLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
        const isSadminLogin = email.toLowerCase() === 'sadmin@internal.local' || email.toLowerCase() === 'sadmin';

        if (isSadminLogin) {
            const sadminUser = users.find(u => u.id === 'sadmin');
            if (sadminUser && password === sadminUser.password) {
                toast({
                    title: 'Login Successful',
                    description: `Welcome, Super Admin!`,
                });
                localStorage.setItem('session', 'sadmin');
                router.push(`/dashboard?role=admin`);
                return; // Guard clause to stop execution
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Login Failed',
                    description: 'The email or password you entered is incorrect.',
                });
                return; // Guard clause
            }
        }
        
        // Mock regular user login
        const appUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        if (appUser) {
             toast({
                title: 'Login Successful',
                description: `Welcome, ${appUser.name}!`,
            });

            localStorage.setItem('session', appUser.id);
            const targetRole = appUser?.role || 'employee';
            router.push(`/dashboard?role=${targetRole}`);
        } else {
             toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'The email or password you entered is incorrect.',
            });
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
    
    // This is a mock sign-in. In a real app, this would be a full OAuth flow.
    setTimeout(() => {
        const mockUserEmail = "mock.user@yourdomain.com";

        if (!allowedDomains.some(domain => mockUserEmail.endsWith(`@${domain}`))) {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'You must use an approved company email address to sign in.',
            });
            setIsLoading(false);
            return;
        }

        const appUser = users.find(u => u.email.toLowerCase() === mockUserEmail.toLowerCase());
        
        if (!appUser) {
            handleNewUser({ uid: `ms-mock-${Date.now()}`, email: mockUserEmail, displayName: "Mock User" });
        }

        toast({
            title: 'Login Successful',
            description: `Welcome, Mock User!`,
        });
        
        const sessionUserId = appUser?.id || 'user-1'; // Fallback for mock
        localStorage.setItem('session', sessionUserId);
        const targetRole = appUser?.role || 'employee';
        router.push(`/dashboard?role=${targetRole}`);
        
        setIsLoading(false);
    }, 1500);
  }

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
            <Button onClick={signInWithMicrosoft} variant="outline" className="w-full" disabled={isLoading}>
              {isLoading ? (
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
                        placeholder="Email or 'sadmin'"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
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
                            disabled={isLoading}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign in
                    </Button>
                </div>
            </form>
      </CardContent>
    </Card>
    </>
  )
}
