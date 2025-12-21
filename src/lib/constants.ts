export const CompanyName = 'AE INTRAWEB';

export const locations = {
    'AMD': 'B-813, K P Epitome, Near Makarba Lake, Makarba, Ahmedabad - 380051.',
    'HYD': '8-1-305/306, 4th Floor, Anand Silicon Chip, Shaikpet, Hyderabad - 500008.'
};

export const holidayLocations = ['ALL', 'AMD', 'HYD', 'US'] as const;

export const documentTypesList: string[] = ['Salary Slip', 'Medical Report', 'Appraisal Letter', 'Personal'];

export const departments: string[] = ['Human Resources', 'Engineering', 'Marketing', 'Sales', 'Information & Technology'];

// Static domain mapping (for reference only - actual mapping is in database)
export const domainToCompanyMap: Record<string, string> = {
    'asepltd.com': 'ASE',
    'amepltd.com': 'AMEP',
    'potomaccs.com': 'POTOMAC',
    'aeintraweb.com': 'AE INTRAWEB'
};

import { Company } from './types';

export const companies: Company[] = [
    {
        id: '1',
        name: 'AE INTRAWEB',
        shortName: 'AE',
        address: 'B-813, K P Epitome, Near Makarba Lake, Makarba, Ahmedabad - 380051.',
        email: 'info@aeintraweb.com',
        phone: '+91 9876543210'
    }
];
