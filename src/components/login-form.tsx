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
import { users } from '@/lib/mock-data'

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
})

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<false | 'employee' | 'admin'>(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>, role: 'employee' | 'admin') {
    setIsLoading(role)
    
    setTimeout(() => {
        const user = users.find(u => u.email.toLowerCase() === values.email.toLowerCase());

        if (!user || user.password !== values.password) {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'Invalid email or password.',
            });
            setIsLoading(false);
            return;
        }

        if (user.role !== role) {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: `You do not have permission to log in as an ${role}.`,
            });
            setIsLoading(false);
            return;
        }

        if (user.status === 'deleted' || user.status === 'inactive') {
            toast({
                variant: 'destructive',
                title: 'Account Disabled',
                description: 'Your account is not active. Please contact an administrator.',
            });
            setIsLoading(false);
            return;
        }
        
        router.push(`/dashboard?role=${role}`);

    }, 1000);
  }

  const handleForgotPassword = () => {
    if (forgotPasswordEmail) {
        toast({
            title: 'Password Reset Link Sent',
            description: `If an account with the email ${forgotPasswordEmail} exists, a password reset link has been sent.`,
        });
        setIsForgotPasswordOpen(false);
        setForgotPasswordEmail('');
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
