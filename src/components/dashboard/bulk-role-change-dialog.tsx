'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users } from 'lucide-react';

interface BulkRoleChangeDialogProps {
  onSave: (newRole: 'admin' | 'employee') => void;
  children: React.ReactNode;
}

export function BulkRoleChangeDialog({ onSave, children }: BulkRoleChangeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'employee'>('employee');

  const handleSave = () => {
    onSave(selectedRole);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Bulk Role Change
          </DialogTitle>
          <DialogDescription>Select a new role to assign to all selected employees.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="role-select">
              New Role
            </Label>
            <Select onValueChange={(value: 'admin' | 'employee') => setSelectedRole(value)} defaultValue={selectedRole}>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</Button>
          <Button onClick={handleSave} className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
