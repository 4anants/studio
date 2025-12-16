
'use client'
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { IdCard } from "./id-card";
import type { User, Company } from "@/lib/types";
import { cn } from "@/lib/utils";

interface IdCardDialogProps {
  employee: User;
  company?: Company;
  children: React.ReactNode;
}

export function IdCardDialog({ employee, company, children }: IdCardDialogProps) {
  const [open, setOpen] = useState(false);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={cn("sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle>Employee ID Card</DialogTitle>
          <DialogDescription>
            Review the employee ID card.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4 print-content">
          <IdCard employee={employee} company={company} />
        </div>



        <DialogFooter className="dialog-footer">
          <Button variant="outline" onClick={() => {
            // Find the ID card content
            const content = document.querySelector('.print-content');
            if (content) {
              // Create the portal container that matches our new CSS selector
              const portal = document.createElement('div');
              portal.id = 'print-portal';

              // Clone the content into the portal
              // We append the child's content (IdCard)
              const clone = content.cloneNode(true);
              portal.appendChild(clone);

              // Add to body
              document.body.appendChild(portal);

              // Print
              window.print();

              // Cleanup
              document.body.removeChild(portal);
            } else {
              window.print(); // Fallback
            }
          }}>Print</Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
