
'use client'

import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Label } from './ui/label'
import { users as initialUsers, User } from '@/lib/mock-data'
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, OAuthProvider, signInWithPopup } from 'firebase/auth'
import { initializeFirebase } from '@/firebase'

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
})

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
  const [isLoading, setIsLoading] = useState<false | 'employee' | 'admin' | 'microsoft'>(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [users, setUsers] = useState(initialUsers)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

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
    setIsLoading('microsoft');
    const { auth } = initializeFirebase();
    const provider = new OAuthProvider('microsoft.com');
    
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        handleNewUser(user);
        toast({
            title: 'Login Successful',
            description: `Welcome, ${user.displayName || user.email}!`,
        });
        router.push('/dashboard');
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


  async function onSubmit(values: z.infer<typeof formSchema>, role: 'employee' | 'admin') {
    setIsLoading(role)
    const { auth } = initializeFirebase();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password)
      const user = userCredential.user

      // This part now uses the mock data just to check role, a real implementation would use custom claims
      const appUser = users.find(u => u.email.toLowerCase() === values.email.toLowerCase());
      
      if (!appUser) {
        throw new Error("User not found in application records.");
      }

      if (appUser.status === 'deleted' || appUser.status === 'inactive') {
        throw new Error('Your account is not active. Please contact an administrator.');
      }

      if (role === 'admin' && appUser.role !== 'admin') {
        throw new Error(`You do not have permission to log in as an ${role}.`);
      }

      router.push(`/dashboard?role=${appUser.role}`)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description:
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential'
            ? 'Invalid email or password.'
            : error.message || 'An unexpected error occurred.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (forgotPasswordEmail) {
      const { auth } = initializeFirebase();
      try {
        await sendPasswordResetEmail(auth, forgotPasswordEmail);
        toast({
          title: 'Password Reset Link Sent',
          description: `If an account with the email ${forgotPasswordEmail} exists, a password reset link has been sent.`,
        });
        setIsForgotPasswordOpen(false);
        setForgotPasswordEmail('');
      } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Failed to Send Email',
            description: error.message || "An error occurred.",
        });
      }
    }
  }

  return (
    <>
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="flex items-center">
                <AlertDialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="ml-auto inline-block text-sm underline"
                    >
                      Forgot your password?
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Forgot Password</AlertDialogTitle>
                      <AlertDialogDescription>
                        Enter your email address and we'll send you a link to reset your password.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="name@company.com"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleForgotPassword}>Submit</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button onClick={signInWithMicrosoft} variant="outline" className="w-full" disabled={!!isLoading}>
              {isLoading === 'microsoft' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MicrosoftLogo />
              )}
              Sign in with Microsoft
            </Button>
            
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
            </div>

            <Button 
              onClick={form.handleSubmit(values => onSubmit(values, 'employee'))} 
              className="w-full" 
              disabled={!!isLoading}
            >
              {isLoading === 'employee' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login as Employee
            </Button>
            <Button 
              onClick={form.handleSubmit(values => onSubmit(values, 'admin'))} 
              variant="secondary" 
              className="w-full"
              disabled={!!isLoading}
            >
              {isLoading === 'admin' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login as Admin
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
    </>
  )
}
