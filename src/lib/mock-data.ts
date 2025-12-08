
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
export type CompanyName = Company['name'];

export const companies: Company[] = [
    { id: 'comp-1', name: 'ASE ENGINEERS PRIVATE LIMITED', shortName: 'ASE', address: 'B-813, K P Epitome, Near Makarba Lake, Makarba, Ahmedabad - 380051.', phone: '123-456-7890', email: 'contact@ase.com' },
    { id: 'comp-2', name: 'ALLIANCE MEP PRIVATE LIMITED', shortName: 'AMEP', address: '8-1-305/306, 4th Floor, Anand Silicon Chip, Shaikpet, Hyderabad - 500008.', phone: '123-456-7891', email: 'contact@amep.com' },
    { id: 'comp-3', name: 'POTOMAC CONSULTING SERVICES PRIVATE LIMITED', shortName: 'POTOMAC', address: 'Some other address, City, State - 123456', phone: '123-456-7892', email: 'contact@potomac.com' },
];

export const locations = {
    'AMD': 'B-813, K P Epitome, Near Makarba Lake, Makarba, Ahmedabad - 380051.',
    'HYD': '8-1-305/306, 4th Floor, Anand Silicon Chip, Shaikpet, Hyderabad - 500008.'
};
export type LocationKey = keyof typeof locations;


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
  company?: CompanyName;
  location?: LocationKey;
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


export const documentTypesList: string[] = ['Salary Slip', 'Medical Report', 'Appraisal Letter', 'Personal'];

export const departments: string[] = ['Human Resources', 'Engineering', 'Marketing', 'Sales', 'Information & Technology'];

export const users: User[] = [
  { id: 'sadmin', name: 'Super Admin', email: 'sadmin@internal.local', password: 'Supper@321..', avatar: 'sadmin', status: 'active', role: 'admin' },
  { id: 'user-1', name: 'Alice Johnson', email: 'alice.j@company.com', personalEmail: 'alice.personal@email.com', avatar: '1', mobile: '1234567890', emergencyContact: '1112223333', password: 'password123', dateOfBirth: '1990-05-15', joiningDate: '2020-01-10', status: 'active', department: 'Engineering', designation: 'Senior Software Engineer', bloodGroup: 'O+', company: 'ASE ENGINEERS PRIVATE LIMITED', location: 'AMD', role: 'admin' },
  { id: 'user-2', name: 'Bob Williams', email: 'bob.w@company.com', personalEmail: 'bob.personal@email.com', avatar: '2', mobile: '1234567891', emergencyContact: '4445556666', password: 'password123', dateOfBirth: '1985-11-22', joiningDate: '2018-03-12', status: 'active', department: 'Marketing', designation: 'Marketing Manager', bloodGroup: 'A-', company: 'ALLIANCE MEP PRIVATE LIMITED', location: 'HYD', role: 'employee' },
  { id: 'user-3', name: 'Charlie Brown', email: 'charlie.b@company.com', personalEmail: 'charlie.personal@email.com', avatar: '3', mobile: '1234567892', emergencyContact: '7778889999', password: 'password123', dateOfBirth: '1992-08-30', joiningDate: '2021-07-01', status: 'active', department: 'Engineering', designation: 'Software Engineer', bloodGroup: 'B+', company: 'POTOMAC CONSULTING SERVICES PRIVATE LIMITED', location: 'AMD', role: 'employee' },
  { id: 'A-134', name: 'Anant Upenkumar Shah', email: 'anant.shah@company.com', personalEmail: 'anant.personal@email.com', avatar: '134', mobile: '1234567893', emergencyContact: '1231231234', password: 'password123', dateOfBirth: '1995-02-20', joiningDate: '2022-08-01', status: 'active', department: 'Information & Technology', designation: 'IT Specialist', bloodGroup: 'A+', company: 'ASE ENGINEERS PRIVATE LIMITED', location: 'HYD', role: 'employee' },
];

export const documents: Document[] = [
  { id: 'doc-1', name: 'June 2024 Payslip.pdf', type: 'Salary Slip', size: '245 KB', uploadDate: '2024-06-28', ownerId: 'user-1', fileType: 'pdf' },
  { id: 'doc-2', name: 'Annual Health Checkup.pdf', type: 'Medical Report', size: '1.2 MB', uploadDate: '2024-06-15', ownerId: 'user-1', fileType: 'pdf' },
  { id: 'doc-3', name: '2023-2024 Appraisal.docx', type: 'Appraisal Letter', size: '88 KB', uploadDate: '2024-04-10', ownerId: 'user-1', fileType: 'doc' },
  { id: 'doc-4', name: 'Passport_Scan.jpg', type: 'Personal', size: '850 KB', uploadDate: '2024-03-01', ownerId: 'user-1', fileType: 'image' },
  { id: 'doc-5', name: 'June 2024 Payslip.pdf', type: 'Salary Slip', size: '248 KB', uploadDate: '2024-06-28', ownerId: 'user-2', fileType: 'pdf' },
  { id: 'doc-6', name: 'Performance Review Q2.docx', type: 'Appraisal Letter', size: '95 KB', uploadDate: '2024-07-01', ownerId: 'user-2', fileType: 'doc' },
  { id: 'doc-7', name: 'June 2024 Payslip.pdf', type: 'Salary Slip', size: '251 KB', uploadDate: '2024-06-28', ownerId: 'user-3', fileType: 'pdf' },
];

export const holidays: Holiday[] = [
    { id: 'h-1', date: '2024-01-01', name: 'New Year\'s Day', location: 'ALL' },
    { id: 'h-2', date: '2024-10-17', name: 'Diwali', location: 'AMD' },
    { id: 'h-4', date: '2024-10-17', name: 'Diwali', location: 'HYD' },
    { id: 'h-5', date: '2024-11-28', name: 'Thanksgiving Day', location: 'US' },
    { id: 'h-3', date: '2024-12-25', name: 'Christmas Day', location: 'ALL' },
];

export const announcements: Announcement[] = [
  { id: 'anno-1', title: 'System Maintenance Scheduled', message: 'The internal portal will be down for scheduled maintenance on Sunday from 2:00 AM to 4:00 AM. We apologize for any inconvenience.', date: '2024-07-25T10:00:00Z', author: 'Admin', isRead: false, status: 'published', eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
  { id: 'anno-2', title: 'Welcome New Team Members!', message: 'Please join us in welcoming our new software engineers, David and Fiona, who are joining the Engineering team this week!', date: '2024-07-22T14:30:00Z', author: 'Admin', isRead: true, status: 'published' },
];

export const CompanyName = 'AE INTRAWEB';
