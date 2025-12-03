export type Document = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  ownerId: string;
  fileType: 'pdf' | 'doc' | 'image';
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  mobile?: string;
  password?: string;
  dateOfBirth?: string;
  joiningDate?: string;
  designation?: string;
  status: 'active' | 'inactive' | 'pending' | 'deleted';
  department?: string;
};

export const documentTypesList: string[] = ['Salary Slip', 'Medical Report', 'Appraisal Letter', 'Personal'];

export const departments: string[] = ['Human Resources', 'Engineering', 'Marketing', 'Sales'];

export const users: User[] = [
  { id: 'user-1', name: 'Alice Johnson', email: 'alice.j@company.com', avatar: '1', mobile: '123-456-7890', password: 'password123', dateOfBirth: '1990-05-15', joiningDate: '2020-01-10', status: 'active', department: 'Engineering', designation: 'Senior Software Engineer' },
  { id: 'user-2', name: 'Bob Williams', email: 'bob.w@company.com', avatar: '2', mobile: '123-456-7891', password: 'password123', dateOfBirth: '1985-11-22', joiningDate: '2018-03-12', status: 'active', department: 'Marketing', designation: 'Marketing Manager' },
  { id: 'user-3', name: 'Charlie Brown', email: 'charlie.b@company.com', avatar: '3', mobile: '123-456-7892', password: 'password123', dateOfBirth: '1992-08-30', joiningDate: '2021-07-01', status: 'active', department: 'Engineering', designation: 'Software Engineer' },
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
