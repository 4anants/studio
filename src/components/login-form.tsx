
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
import { signInWithPopup, OAuthProvider, signInWithEmailAndPassword } from 'firebase/auth'
import { useAuth } from '@/firebase'

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
  const [isLoading, setIsLoading] = useState(false)
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [users, setUsers] = useState(initialUsers)
  const { toast } = useToast()
  const auth = useAuth();
  const [allowedDomains, setAllowedDomains] = useState<string[]>(['yourdomain.com']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const storedDomains = localStorage.getItem('allowedDomains');
    if (storedDomains) {
      setAllowedDomains(JSON.parse(storedDomains));
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
            avatar: String(Date.now()), // default avatar seed
        };
        setUsers(prev => [...prev, newUser]);
        console.log('New user created:', newUser);
    }
  };

  async function handleLocalLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!auth) {
        toast({ variant: 'destructive', title: 'Login Failed', description: 'Authentication service not available.' });
        return;
    }
    setLocalIsLoading(true);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userEmail = user.email;

        const appUser = users.find(u => u.email.toLowerCase() === userEmail?.toLowerCase());

        toast({
            title: 'Login Successful',
            description: `Welcome, ${appUser?.name || userEmail}!`,
        });

        const targetRole = appUser?.role || 'employee';
        router.push(`/dashboard?role=${targetRole}`);

    } catch (error: any) {
        let description = 'An unexpected error occurred.';
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                description = 'The email or password you entered is incorrect.';
                break;
            case 'auth/invalid-email':
                description = 'Please enter a valid email address.';
                break;
        }
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: description,
        });
    } finally {
        setLocalIsLoading(false);
    }
  }

  async function signInWithMicrosoft() {
    setIsLoading(true);
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Microsoft Sign-In Failed',
            description: 'Authentication service is not available.',
        });
        setIsLoading(false);
        return;
    }
    const provider = new OAuthProvider('microsoft.com');

    // IMPORTANT: You should replace this with your actual Microsoft tenant ID for production
    // This restricts login to your organization only.
    provider.setCustomParameters({ tenant: 'YOUR_TENANT_ID' }); 
    
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userEmail = user.email;

        // --- Domain Validation ---
        if (!userEmail || !allowedDomains.some(domain => userEmail.endsWith(`@${domain}`))) {
            await auth.signOut();
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'You must use an approved company email address to sign in.',
            });
            setIsLoading(false);
            return;
        }
        // --- End of Domain Validation ---

        const appUser = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());

        handleNewUser(user);

        toast({
            title: 'Login Successful',
            description: `Welcome, ${user.displayName || userEmail}!`,
        });

        const targetRole = appUser?.role || 'employee';
        router.push(`/dashboard?role=${targetRole}`);
        
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Microsoft Sign-In Failed',
            description: error.message || 'An unexpected error occurred.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <>
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
            Use your Microsoft account to sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
            <Button onClick={signInWithMicrosoft} variant="outline" className="w-full" disabled={isLoading || localIsLoading}>
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
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading || localIsLoading}
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
                            disabled={isLoading || localIsLoading}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || localIsLoading}>
                        {localIsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign in
                    </Button>
                </div>
            </form>
      </CardContent>
    </Card>
    </>
  )
}
