import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    const connection = await pool.getConnection();

    try {
        const results: any = {
            users: { before: 0, updated: 0 },
            companies: { before: 0, updated: 0 },
            events: { before: 0, updated: 0 },
            polls: { before: 0, updated: 0 },
            resources: { before: 0, updated: 0 },
            holidays: { before: 0, updated: 0 },
            errors: []
        };

        // Valid locations from centralized constants
        const validLocations = ['ALL', 'AMD', 'HYD', 'US'];

        // Location mapping for common variations
        const locationMapping: Record<string, string> = {
            'Ahmedabad': 'AMD',
            'ahmedabad': 'AMD',
            'AHMEDABAD': 'AMD',
            'amd': 'AMD',
            'Hyderabad': 'HYD',
            'hyderabad': 'HYD',
            'HYDERABAD': 'HYD',
            'hyd': 'HYD',
            'United States': 'US',
            'USA': 'US',
            'usa': 'US',
            'us': 'US',
            'all': 'ALL',
            'All': 'ALL',
        };

        // 1. Update users table
        try {
            const [users]: any = await connection.query(`
                SELECT id, location FROM users WHERE location IS NOT NULL AND location != ''
            `);
            results.users.before = users.length;

            for (const user of users) {
                const mapped = locationMapping[user.location] || user.location.toUpperCase();
                if (validLocations.includes(mapped) && mapped !== user.location) {
                    await connection.query('UPDATE users SET location = ? WHERE id = ?', [mapped, user.id]);
                    results.users.updated++;
                }
            }
        } catch (error: any) {
            results.errors.push(`Users: ${error.message}`);
        }

        // 2. Update companies table - location field (can be comma-separated)
        try {
            const [companies]: any = await connection.query(`
                SELECT id, location FROM companies WHERE location IS NOT NULL AND location != ''
            `);
            results.companies.before = companies.length;

            for (const company of companies) {
                const locations = company.location.split(',').map((l: string) => l.trim());
                const normalized = locations.map((loc: string) => {
                    const mapped = locationMapping[loc] || loc.toUpperCase();
                    return validLocations.includes(mapped) ? mapped : loc;
                });
                const newLocation = normalized.join(', ');

                if (newLocation !== company.location) {
                    await connection.query('UPDATE companies SET location = ? WHERE id = ?', [newLocation, company.id]);
                    results.companies.updated++;
                }
            }
        } catch (error: any) {
            results.errors.push(`Companies: ${error.message}`);
        }

        // 3. Update engagement_events table
        try {
            const [events]: any = await connection.query(`
                SELECT id, target_location FROM engagement_events WHERE target_location IS NOT NULL
            `);
            results.events.before = events.length;

            for (const event of events) {
                const mapped = locationMapping[event.target_location] || event.target_location.toUpperCase();
                if (validLocations.includes(mapped) && mapped !== event.target_location) {
                    await connection.query('UPDATE engagement_events SET target_location = ? WHERE id = ?', [mapped, event.id]);
                    results.events.updated++;
                }
            }
        } catch (error: any) {
            results.errors.push(`Events: ${error.message}`);
        }

        // 4. Update engagement_polls table
        try {
            const [polls]: any = await connection.query(`
                SELECT id, target_location FROM engagement_polls WHERE target_location IS NOT NULL
            `);
            results.polls.before = polls.length;

            for (const poll of polls) {
                const mapped = locationMapping[poll.target_location] || poll.target_location.toUpperCase();
                if (validLocations.includes(mapped) && mapped !== poll.target_location) {
                    await connection.query('UPDATE engagement_polls SET target_location = ? WHERE id = ?', [mapped, poll.id]);
                    results.polls.updated++;
                }
            }
        } catch (error: any) {
            results.errors.push(`Polls: ${error.message}`);
        }

        // 5. Update engagement_resources table
        try {
            const [resources]: any = await connection.query(`
                SELECT id, target_location FROM engagement_resources WHERE target_location IS NOT NULL
            `);
            results.resources.before = resources.length;

            for (const resource of resources) {
                const mapped = locationMapping[resource.target_location] || resource.target_location.toUpperCase();
                if (validLocations.includes(mapped) && mapped !== resource.target_location) {
                    await connection.query('UPDATE engagement_resources SET target_location = ? WHERE id = ?', [mapped, resource.id]);
                    results.resources.updated++;
                }
            }
        } catch (error: any) {
            results.errors.push(`Resources: ${error.message}`);
        }

        // 6. Update holidays table
        try {
            const [holidays]: any = await connection.query(`
                SELECT id, location FROM holidays WHERE location IS NOT NULL
            `);
            results.holidays.before = holidays.length;

            for (const holiday of holidays) {
                const mapped = locationMapping[holiday.location] || holiday.location.toUpperCase();
                if (validLocations.includes(mapped) && mapped !== holiday.location) {
                    await connection.query('UPDATE holidays SET location = ? WHERE id = ?', [mapped, holiday.id]);
                    results.holidays.updated++;
                }
            }
        } catch (error: any) {
            results.errors.push(`Holidays: ${error.message}`);
        }

        connection.release();

        return NextResponse.json({
            success: true,
            message: 'Location standardization completed',
            validLocations,
            results,
            summary: {
                totalProcessed:
                    results.users.before +
                    results.companies.before +
                    results.events.before +
                    results.polls.before +
                    results.resources.before +
                    results.holidays.before,
                totalUpdated:
                    results.users.updated +
                    results.companies.updated +
                    results.events.updated +
                    results.polls.updated +
                    results.resources.updated +
                    results.holidays.updated
            }
        });
    } catch (error: any) {
        connection.release();
        console.error('Location migration error:', error);
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
