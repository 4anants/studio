export interface FileRow {
    id: string;
    file: File;
    originalName: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    errorMessage?: string;
    selected: boolean;

    // Parsed/Matched Data
    detectedName: string;
    employeeId: string; // The matched user ID
    employeeName?: string; // Display name
    employeeCode?: string; // Display code
    department?: string; // Added Department
    createdDocumentId?: string; // ID of the created document

    // Metadata
    docType: string;
    month: string;
    year: string;
}

export interface GlobalConfig {
    docType: string;
    month: string;
    year: string;
}
