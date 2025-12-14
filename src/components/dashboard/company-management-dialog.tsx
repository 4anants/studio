
'use client'

import { useState, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Camera } from 'lucide-react';
import type { Company } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Company name is required.' }),
  shortName: z.string().min(1, { message: 'Short name is required.' }),
  email: z.string().email({ message: 'A valid email is required.' }).optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  location: z.string().optional(),
  logo: z.string().optional(),
});

interface CompanyManagementDialogProps {
  company?: Company;
  onSave: (company: Company) => void;
  children: React.ReactNode;
}

export function CompanyManagementDialog({ company, onSave, children }: CompanyManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [locations, setLocations] = useState<Array<{ location: string; address: string }>>([
    { location: '', address: '' }
  ]);
  const isEditing = !!company;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: company?.name || '',
      shortName: company?.shortName || '',
      email: company?.email || '',
      phone: company?.phone || '',
      address: company?.address || '',
      location: company?.location || '',
      logo: company?.logo || '',
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setLogoPreview(dataUri);
        form.setValue('logo', dataUri);
      };
      reader.readAsDataURL(file);
    }
  }, [form]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const addLocation = () => {
    setLocations([...locations, { location: '', address: '' }]);
  };

  const removeLocation = (index: number) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index));
    }
  };

  const updateLocation = (index: number, field: 'location' | 'address', value: string) => {
    const newLocations = [...locations];
    newLocations[index][field] = value;
    setLocations(newLocations);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setTimeout(() => {
      // Combine locations and addresses
      const locationString = locations.map(l => l.location).filter(l => l.trim()).join(', ');
      const addressString = locations.map(l => l.address).filter(a => a.trim()).join(' | ');

      onSave({
        ...values,
        location: locationString,
        address: addressString,
        id: company?.id || '', // id is handled by parent
      });
      setIsLoading(false);
      setOpen(false);
      form.reset();
      setLogoPreview(null);
      setLocations([{ location: '', address: '' }]);
    }, 500);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      form.reset({
        name: company?.name || '',
        shortName: company?.shortName || '',
        email: company?.email || '',
        phone: company?.phone || '',
        address: company?.address || '',
        location: company?.location || '',
        logo: company?.logo || '',
      });

      // Parse existing locations and addresses
      if (company?.location && company?.address) {
        const locs = company.location.split(',').map(l => l.trim());
        const addrs = company.address.split('|').map(a => a.trim());
        const parsed = locs.map((loc, i) => ({
          location: loc,
          address: addrs[i] || ''
        }));
        setLocations(parsed.length > 0 ? parsed : [{ location: '', address: '' }]);
      } else {
        setLocations([{ location: '', address: '' }]);
      }

      setLogoPreview(null);
    }
    setOpen(isOpen);
  };

  const currentLogo = logoPreview || company?.logo;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Company' : 'Add New Company'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Update details for ${company.name}.` : 'Enter the details for the new company.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
            <div className="flex justify-center">
              <div {...getRootProps()} className="relative cursor-pointer group">
                <input {...getInputProps()} />
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border">
                  {currentLogo ? (
                    <Image src={currentLogo} width={96} height={96} alt="Company Logo" className="rounded-full object-cover h-full w-full" />
                  ) : (
                    <span className="text-sm text-muted-foreground">Logo</span>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center transition-opacity">
                    <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100" />
                  </div>
                </div>
              </div>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl><Input placeholder="Full legal name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="shortName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Name / Abbreviation</FormLabel>
                  <FormControl><Input placeholder="e.g., ACME" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="contact@company.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input placeholder="+1-123-456-7890" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dynamic Location-Address Pairs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Locations & Addresses</label>
                <Button type="button" variant="outline" size="sm" onClick={addLocation}>
                  + Add Location
                </Button>
              </div>
              {locations.map((loc, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Location {index + 1}</span>
                    {locations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLocation(index)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Location name (e.g., New York)"
                    value={loc.location}
                    onChange={(e) => updateLocation(index, 'location', e.target.value)}
                  />
                  <Textarea
                    placeholder="Full address for this location"
                    value={loc.address}
                    onChange={(e) => updateLocation(index, 'address', e.target.value)}
                    rows={2}
                  />
                </div>
              ))}
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Add Company'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
