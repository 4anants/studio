'use client';

import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import type { User } from '@/lib/mock-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  id: z.string().min(1, { message: 'Employee ID is required.' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  mobile: z.string().optional(),
  password: z.string().optional(),
  dateOfBirth: z.string().optional(),
  joiningDate: z.string().optional(),
  resignationDate: z.string().optional(),
  designation: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']),
  department: z.string().optional(),
});

interface EmployeeManagementDialogProps {
  employee?: User;
  onSave: (employee: Partial<User> & { originalId?: string }) => void;
  children: React.ReactNode;
  departments: string[];
}

export function EmployeeManagementDialog({ employee, onSave, children, departments = [] }: EmployeeManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!employee;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: employee?.id || '',
      name: employee?.name || '',
      email: employee?.email || '',
      mobile: employee?.mobile || '',
      password: '',
      dateOfBirth: employee?.dateOfBirth || '',
      joiningDate: employee?.joiningDate || '',
      resignationDate: employee?.resignationDate || '',
      designation: employee?.designation || '',
      status: (employee?.status === 'active' || employee?.status === 'inactive' || employee?.status === 'pending') ? employee.status : 'active',
      department: employee?.department || '',
    },
  });
  
  const finalSchema = isEditing 
  ? formSchema 
  : formSchema.extend({
      password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
    });


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const validation = finalSchema.safeParse(values);
    if (!validation.success) {
        // This part is to show errors in the form
        Object.entries(validation.error.flatten().fieldErrors).forEach(([name, errors]) => {
            if (errors) {
                 form.setError(name as any, { type: 'manual', message: errors[0] });
            }
        });
        return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const userData: Partial<User> & { originalId?: string } = {
        ...validation.data,
        originalId: employee?.id,
      };

      if (!userData.password) {
        delete userData.password;
      }
      
      onSave(userData);

      if (isEditing) {
        toast({
            title: "Profile Updated",
            description: `An email notification has been sent to the admins regarding the update of ${employee.name}'s profile.`,
        });
      }
      
      setIsLoading(false);
      setOpen(false);
      if (!isEditing) {
        form.reset({ id: '', name: '', email: '', mobile: '', password: '', dateOfBirth: '', joiningDate: '', resignationDate: '', designation: '', status: 'active', department: '' });
      } else {
        form.reset({ ...values, password: '' }); // Clear password field after edit
      }
    }, 1000);
  };
  
  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
        form.reset({
            id: employee?.id || '',
            name: employee?.name || '',
            email: employee?.email || '',
            mobile: employee?.mobile || '',
            password: '',
            dateOfBirth: employee?.dateOfBirth || '',
            joiningDate: employee?.joiningDate || '',
            resignationDate: employee?.resignationDate || '',
            designation: employee?.designation || '',
            status: (employee?.status === 'active' || employee?.status === 'inactive' || employee?.status === 'pending') ? employee.status : 'active',
            department: employee?.department || '',
        });
    }
    setOpen(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update the details for ${employee.name}. Leave password blank to keep it unchanged.` : 'Enter the details for the new employee.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 py-4">
             <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Employee ID</FormLabel>
                  <FormControl>
                    <Input placeholder="user-id-123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@company.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
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
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="joiningDate"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Joining Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="resignationDate"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Resignation Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={isEditing ? "Leave blank to keep current" : "••••••••"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="col-span-2 sm:col-span-1">
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className="col-span-2">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Save Changes' : 'Create Employee'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
