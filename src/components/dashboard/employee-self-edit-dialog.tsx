'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { getAvatarSrc } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { PinVerifyDialog } from './pin-verify-dialog';

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
  onSave: (employee: Partial<User> & { originalId?: string }) => Promise<void>;
  children: React.ReactNode;
}

export function EmployeeSelfEditDialog({ employee, onSave, children }: EmployeeSelfEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pinVerifyOpen, setPinVerifyOpen] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
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
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 2MB.",
          variant: "destructive"
        });
        return;
      }
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const { password, ...rest } = values;
      const userData: Partial<User> & { originalId?: string } = {
        ...rest,
        originalId: employee.id,
      };

      if (password) {
        userData.password = password;
      }

      await onSave(userData);

      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });

      setOpen(false);
    } catch (error) {
      // Error is handled by parent (toast), just stop loading
      logger.error("Self edit save failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // We don't directly open this dialog through the trigger anymore
      // We call setPinVerifyOpen(true) via the trigger's onClick
      setPinVerifyOpen(true);
    } else {
      setOpen(false);
      setPinVerified(false);
      form.reset();
      setAvatarPreview(null);
    }
  }

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPinVerifyOpen(true);
  };

  const handlePinSuccess = () => {
    setPinVerified(true);
    setOpen(true);
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

  const currentAvatarSrc = avatarPreview || getAvatarSrc(employee);

  return (
    <>
      <PinVerifyDialog
        open={pinVerifyOpen}
        onOpenChange={setPinVerifyOpen}
        onSuccess={handlePinSuccess}
        action="edit"
        customTitle="Verify Identity"
        customDescription="Please enter your 4-digit PIN to edit your profile."
      />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <div onClick={handleTriggerClick}>
          {children}
        </div>
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
                    alt={employee.name ? employee.name : 'Profile'}
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
                      <Input placeholder="Enter your personal email" autoComplete="email" {...field} />
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
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">+91</span>
                        </div>
                        <Input placeholder="Enter mobile number" autoComplete="tel" {...field} className="pl-12" />
                      </div>
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
                    <FormLabel>Emergency Contact</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500 sm:text-sm">+91</span>
                        </div>
                        <Input placeholder="Enter emergency contact" autoComplete="tel" {...field} className="pl-12" />
                      </div>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Blood Group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <SelectItem key={bg} value={bg}>
                            {bg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Input
                        type="password"
                        placeholder="Leave blank to keep current"
                        autoComplete="new-password"
                        id="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isLoading} className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
