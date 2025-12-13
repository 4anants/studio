
export type Document = {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    ownerId: string;
    fileType: 'pdf' | 'doc' | 'image';
};

export type Company = {
    id: string;
    name: string;
    shortName: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string; // data URI
};

export type CompanyName = string; // Simplified from mapping

export type User = {
    id: string;
    name: string;
    email: string; // Official Email
    personalEmail?: string;
    avatar: string;
    mobile?: string;
    emergencyContact?: string;
    password?: string;
    dateOfBirth?: string;
    joiningDate?: string;
    resignationDate?: string;
    designation?: string;
    status: 'active' | 'inactive' | 'pending' | 'deleted';
    department?: string;
    bloodGroup?: string;
    company?: string;
    location?: string;
    role: 'admin' | 'employee';
};

export const holidayLocations = ['ALL', 'AMD', 'HYD', 'US'] as const;
export type HolidayLocation = typeof holidayLocations[number];

export type Holiday = {
    id: string;
    date: string; // YYYY-MM-DD
    name: string;
    location: HolidayLocation;
};

export type Announcement = {
    id: string;
    title: string;
    message: string;
    date: string; // ISO 8601 format
    author: string;
    isRead?: boolean;
    status: 'published' | 'deleted';
    eventDate?: string; // YYYY-MM-DD
};

export type Department = {
    id: string;
    name: string;
    status: 'active' | 'deleted';
};

export type DocumentType = {
    id: string;
    name: string;
    status: 'active' | 'deleted';
};
