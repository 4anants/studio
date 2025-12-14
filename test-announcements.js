
const BASE_URL = 'http://localhost:3000/api/announcements';

async function testAnnouncements() {
    const { default: fetch } = await import('node-fetch');

    console.log('--- Starting Announcement API Test ---');
    const testId = `test-anno-${Date.now()}`;
    const testAnnouncement = {
        id: testId,
        title: 'Test Announcement',
        message: 'This is a test.',
        date: new Date().toISOString(),
        author: 'Test Bot',
        status: 'published',
        is_read: true, // Note: Frontend might send isRead, but API expects mapped OR is_read. API route takes is_read.
        // Frontend sends: ...announcement, is_read: announcement.isRead.
        // If I strictly allow frontend behavior, I should send `is_read`.
        event_date: new Date().toISOString()
    };

    // 1. Create
    console.log(`1. Creating Announcement: ${testId}`);
    try {
        const createRes = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testAnnouncement)
        });
        const createJson = await createRes.json();
        console.log('Create Response:', createRes.status, createJson);
        if (!createRes.ok) throw new Error('Create failed');
    } catch (e) {
        console.error('Create Error:', e);
        return;
    }

    // 2. Soft Delete
    console.log(`2. Soft Deleting Announcement: ${testId}`);
    try {
        // Frontend sends spread + status: 'deleted' + specific fields
        const softDeleteBody = {
            ...testAnnouncement,
            status: 'deleted',
            // Mimic frontend exactly: 
            // event_date: announcement.eventDate (if camel)
            // is_read: announcement.isRead (if camel)
            // But API route uses is_read and event_date.
            // I'll send correct snake_case as my previous fix enforces it.
            is_read: true,
            event_date: testAnnouncement.event_date
        };

        const deleteRes = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(softDeleteBody)
        });
        const deleteJson = await deleteRes.json();
        console.log('Soft Delete Response:', deleteRes.status, deleteJson);
        if (!deleteRes.ok) throw new Error('Soft Delete failed');
    } catch (e) {
        console.error('Soft Delete Error:', e);
        return;
    }

    // 3. Permanent Delete
    console.log(`3. Permanently Deleting Announcement: ${testId}`);
    try {
        const permDeleteRes = await fetch(`${BASE_URL}?id=${testId}`, {
            method: 'DELETE'
        });
        const permDeleteJson = await permDeleteRes.json();
        console.log('Permanent Delete Response:', permDeleteRes.status, permDeleteJson);
        if (!permDeleteRes.ok) throw new Error('Permanent Delete failed');
    } catch (e) {
        console.error('Permanent Delete Error:', e);
        return;
    }

    console.log('--- Test Complete ---');
}

testAnnouncements();
