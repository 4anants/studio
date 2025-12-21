'use client';

// A simple localStorage wrapper for the preview data
export const previewStore = {
    get: (key: string, defaultValue: any) => {
        if (typeof window === 'undefined') return defaultValue;
        const saved = localStorage.getItem(`preview_${key}`);
        return saved ? JSON.parse(saved) : defaultValue;
    },
    set: (key: string, data: any) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(`preview_${key}`, JSON.stringify(data));
        // Dispatch custom event to notify listeners
        window.dispatchEvent(new CustomEvent(`preview_data_updated`, { detail: { key } }));
    },
    getRole: () => {
        if (typeof window === 'undefined') return 'employee';
        return localStorage.getItem('preview_role') || 'employee';
    },
    setRole: (role: 'admin' | 'employee') => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('preview_role', role);
        window.dispatchEvent(new CustomEvent('preview_role_updated', { detail: { role } }));
    },
    getMeta: () => {
        if (typeof window === 'undefined') return { location: 'ALL', department: 'ALL' };
        const meta = localStorage.getItem('preview_meta');
        return meta ? JSON.parse(meta) : { location: 'ALL', department: 'ALL' };
    },
    setMeta: (meta: { location: string, department: string }) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('preview_meta', JSON.stringify(meta));
        window.dispatchEvent(new CustomEvent('preview_meta_updated', { detail: meta }));
    }
};

export const INITIAL_EVENTS = [
    {
        id: '1',
        title: "Annual Team Picnic 2024",
        date: "2024-12-24",
        time: "10:00 AM",
        location: "Central Park West",
        type: "Outing",
        color: "bg-green-500",
        description: "A fun-filled day with sports, music, and great food!",
        targetLocation: "ALL",
        targetDepartment: "ALL"
    },
    {
        id: '2',
        title: "Q4 Tech Webinar",
        date: "2024-12-28",
        time: "03:00 PM",
        location: "Google Meet",
        type: "Webinar",
        color: "bg-blue-500",
        description: "Deep dive into our new security architecture and roadmap.",
        targetLocation: "ALL",
        targetDepartment: "Engineering"
    }
];

export const INITIAL_RESOURCES = [
    {
        id: '1',
        category: "Mandatory Reading",
        name: "Employee Handbook 2024",
        type: "PDF",
        size: "2.4 MB"
    },
    {
        id: '2',
        category: "Quick Links",
        name: "HR Portal",
        type: "Link"
    }
];

export const INITIAL_POLLS = [
    {
        id: '1',
        question: "Where should we host the Annual Team Picnic this year?",
        options: [
            { id: 'a', text: "Lakeside Resort", votes: 45 },
            { id: 'b', text: "Highland Retreat", votes: 30 },
            { id: 'c', text: "City Adventure Park", votes: 25 },
        ],
        isActive: true,
        targetLocation: "ALL",
        targetDepartment: "ALL"
    }
];
