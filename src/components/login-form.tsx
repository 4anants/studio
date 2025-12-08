
'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import { users as initialUsers, User } from '@/lib/mock-data'
import { signInWithPopup, OAuthProvider } from 'firebase/auth'
import { initializeFirebase } from '@/firebase'

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
  const [users, setUsers] = useState(initialUsers)
  const { toast } = useToast()

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

  async function signInWithMicrosoft() {
    setIsLoading(true);
    const { auth } = initializeFirebase();
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

    // To restrict login to your organization's tenant, add your tenant ID here.
    provider.setCustomParameters({ tenant: 'YOUR_TENANT_ID' }); // Replace YOUR_TENANT_ID
    
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const userEmail = user.email;

        // --- Domain Validation ---
        // IMPORTANT: Replace 'yourdomain.com' with your actual company domain.
        const allowedDomain = 'yourdomain.com';

        if (!userEmail || !userEmail.endsWith(`@${allowedDomain}`)) {
            // If the user's email domain is not the one you want, show an error and sign them out.
            await auth.signOut();
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: `You must use an @${allowedDomain} email address to sign in.`,
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
        <CardTitle>Sign in with your work account</CardTitle>
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
      </CardContent>
    </Card>
    </>
  )
}
