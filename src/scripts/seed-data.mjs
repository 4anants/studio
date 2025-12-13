import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');

dotenv.config({ path: '.env.local' });

const companies = [
    { id: 'comp-1', name: 'ASE ENGINEERS PRIVATE LIMITED', shortName: 'ASE', address: 'B-813, K P Epitome, Near Makarba Lake, Makarba, Ahmedabad - 380051.', phone: '123-456-7890', email: 'contact@ase.com' },
    { id: 'comp-2', name: 'ALLIANCE MEP PRIVATE LIMITED', shortName: 'AMEP', address: '8-1-305/306, 4th Floor, Anand Silicon Chip, Shaikpet, Hyderabad - 500008.', phone: '123-456-7891', email: 'contact@amep.com' },
    { id: 'comp-3', name: 'POTOMAC CONSULTING SERVICES PRIVATE LIMITED', shortName: 'POTOMAC', address: 'Some other address, City, State - 123456', phone: '123-456-7892', email: 'contact@potomac.com' },
];

const users = [
    { id: 'sadmin', name: 'Super Admin', email: 'sadmin@internal.local', password: 'Supper@321..', avatar: 'sadmin', status: 'active', role: 'admin', designation: 'Super Administrator', department: 'Information & Technology', company: 'ASE', location: 'AMD' },
    { id: 'user-1', name: 'Alice Johnson', email: 'alice.j@company.com', personalEmail: 'alice.personal@email.com', avatar: '1', mobile: '1234567890', emergencyContact: '1112223333', password: 'password123', dateOfBirth: '1990-05-15', joiningDate: '2020-01-10', status: 'active', department: 'Engineering', designation: 'Senior Software Engineer', bloodGroup: 'O+', company: 'ASE', location: 'AMD', role: 'admin' },
    { id: 'user-2', name: 'Bob Williams', email: 'bob.w@company.com', personalEmail: 'bob.personal@email.com', avatar: '2', mobile: '1234567891', emergencyContact: '4445556666', password: 'password123', dateOfBirth: '1985-11-22', joiningDate: '2018-03-12', status: 'active', department: 'Marketing', designation: 'Marketing Manager', bloodGroup: 'A-', company: 'AMEP', location: 'HYD', role: 'employee' },
    { id: 'user-3', name: 'Charlie Brown', email: 'charlie.b@company.com', personalEmail: 'charlie.personal@email.com', avatar: '3', mobile: '1234567892', emergencyContact: '7778889999', password: 'password123', dateOfBirth: '1992-08-30', joiningDate: '2021-07-01', status: 'active', department: 'Engineering', designation: 'Software Engineer', bloodGroup: 'B+', company: 'POTOMAC', location: 'AMD', role: 'employee' },
    { id: 'A-134', name: 'Anant Upenkumar Shah', email: 'anant.shah@company.com', personalEmail: 'anant.personal@email.com', avatar: '134', mobile: '1234567893', emergencyContact: '1231231234', password: 'password123', dateOfBirth: '1995-02-20', joiningDate: '2022-08-01', status: 'active', department: 'Information & Technology', designation: 'IT Specialist', bloodGroup: 'A+', company: 'ASE', location: 'HYD', role: 'employee' },
];

const holidays = [
    { id: 'h-1', date: '2024-01-01', name: 'New Year\'s Day', location: 'ALL' },
    { id: 'h-2', date: '2024-10-17', name: 'Diwali', location: 'AMD' },
    { id: 'h-4', date: '2024-10-17', name: 'Diwali', location: 'HYD' },
    { id: 'h-5', date: '2024-11-28', name: 'Thanksgiving Day', location: 'US' },
    { id: 'h-3', date: '2024-12-25', name: 'Christmas Day', location: 'ALL' },
];

const announcements = [
    { id: 'anno-1', title: 'System Maintenance Scheduled', message: 'The internal portal will be down for scheduled maintenance on Sunday from 2:00 AM to 4:00 AM. We apologize for any inconvenience.', date: '2024-07-25 10:00:00', author: 'Admin', status: 'published', eventDate: '2024-07-28' },
    { id: 'anno-2', title: 'Welcome New Team Members!', message: 'Please join us in welcoming our new software engineers, David and Fiona, who are joining the Engineering team this week!', date: '2024-07-22 14:30:00', author: 'Admin', status: 'published' },
];

async function seed() {
    console.log('Seeding database...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        console.log('Connected.');
        // Companies
        console.log('Seeding Companies...');
        await connection.query('DELETE FROM companies');
        for (const c of companies) {
            await connection.execute(
                'INSERT INTO companies (id, name, short_name, address, phone, email) VALUES (?, ?, ?, ?, ?, ?)',
                [c.id, c.name, c.shortName, c.address, c.phone, c.email]
            );
        }

        // Users
        console.log('Seeding Users...');
        await connection.query('DELETE FROM users');
        for (const u of users) {
            // For seed data, we might skip hashing if bcrypt fails or is slow, but let's try
            const passwordHash = bcrypt.hashSync(u.password, 10);

            const nameParts = u.name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';
            const companyId = companies.find(c => c.shortName === u.company)?.id || null;

            await connection.execute(
                `INSERT INTO users (
                    id, username, first_name, last_name, email, personal_email, password_hash, is_admin, 
                    avatar, mobile, emergency_contact, date_of_birth, joining_date, designation, department, blood_group, company_id, location, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    u.id,
                    u.email.split('@')[0],
                    firstName,
                    lastName,
                    u.email,
                    u.personalEmail || null,
                    passwordHash,
                    u.role === 'admin',
                    u.avatar || null,
                    u.mobile || null,
                    u.emergencyContact || null,
                    u.dateOfBirth || null,
                    u.joiningDate || null,
                    u.designation || null,
                    u.department || null,
                    u.bloodGroup || null,
                    companyId,
                    u.location || null,
                    u.status || 'active'
                ]
            );
        }

        // Holidays
        console.log('Seeding Holidays...');
        await connection.query('DELETE FROM holidays');
        for (const h of holidays) {
            await connection.execute(
                'INSERT INTO holidays (id, date, name, location) VALUES (?, ?, ?, ?)',
                [h.id, h.date, h.name, h.location]
            );
        }

        // Announcements
        console.log('Seeding Announcements...');
        await connection.query('DELETE FROM announcements');
        for (const a of announcements) {
            await connection.execute(
                'INSERT INTO announcements (id, title, message, date, author, status, event_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [a.id, a.title, a.message, a.date, a.author, a.status, a.eventDate || null]
            );
        }

        console.log('Seeding Complete!');

    } catch (e) {
        console.error('Seeding failed:', e);
    } finally {
        await connection.end();
    }
}

seed();
