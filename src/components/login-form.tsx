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

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
})

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<false | 'employee' | 'admin'>(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>, role: 'employee' | 'admin') {
    setIsLoading(role)
    // Simulate API call
    setTimeout(() => {
      router.push(`/dashboard?role=${role}`)
    }, 1000)
  }

  return (
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
  )
}
