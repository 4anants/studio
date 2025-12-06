
'use client';

import { useState, useCallback, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Camera } from 'lucide-react';
import type { User } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';

const formSchema = z.object({
  personalEmail: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  mobile: z.string().optional(),
  emergencyContact: z.string().optional(),
  password: z.string().optional(),
  avatar: z.string().optional(),
  bloodGroup: z.string().optional(),
});

interface EmployeeSelfEditDialogProps {
  employee: User;
  onSave: (employee: Partial<User> & { originalId?: string }) => void;
  children: React.ReactNode;
}

export function EmployeeSelfEditDialog({ employee, onSave, children }: EmployeeSelfEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personalEmail: employee?.personalEmail || '',
      mobile: employee?.mobile || '',
      emergencyContact: employee?.emergencyContact || '',
      password: '',
      avatar: employee?.avatar,
      bloodGroup: employee?.bloodGroup || '',
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setAvatarPreview(dataUri);
        form.setValue('avatar', dataUri);
      };
      reader.readAsDataURL(file);
    }
  }, [form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setTimeout(() => {
      const { password, ...rest } = values;
      const userData: Partial<User> & { originalId?: string } = {
        ...rest,
        originalId: employee.id,
      };

      if (password) {
        userData.password = password;
      }

      onSave(userData);

      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
      
      setIsLoading(false);
      setOpen(false);
    }, 1000);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
        form.reset({
            personalEmail: employee?.personalEmail || '',
            mobile: employee?.mobile || '',
            emergencyContact: employee?.emergencyContact || '',
            password: '',
            avatar: employee?.avatar,
            bloodGroup: employee?.bloodGroup || '',
        });
        setAvatarPreview(null);
    }
    setOpen(isOpen);
  }

  const getAvatarSrc = () => {
    if (avatarPreview) return avatarPreview;
    if (employee.avatar && employee.avatar.startsWith('data:image')) return employee.avatar;
    return `https://picsum.photos/seed/${employee.avatar}/128/128`
  }

  const currentAvatarSrc = getAvatarSrc();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
          <DialogDescription>
            Update your contact information. Leave password blank to keep it unchanged.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
            <div className="flex justify-center">
                 <div {...getRootProps()} className="relative cursor-pointer group">
                    <input {...getInputProps()} />
                    <Image 
                        src={currentAvatarSrc} 
                        width={128} 
                        height={128} 
                        className="rounded-full object-cover" 
                        alt={employee.name}
                        data-ai-hint="person portrait" 
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center transition-opacity">
                        <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100" />
                    </div>
                </div>
            </div>
             <FormItem>
                <FormLabel>Official Email</FormLabel>
                <FormControl>
                    <Input value={employee.email} disabled />
                </FormControl>
             </FormItem>
             <FormField
              control={form.control}
              name="personalEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your.personal@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile No.</FormLabel>
                  <FormControl>
                    <Input placeholder="123-456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergencyContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Contact No.</FormLabel>
                  <FormControl>
                    <Input placeholder="987-654-3210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="bloodGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blood Group</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. A+" {...field} />
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
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Leave blank to keep current" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className="pt-4">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
