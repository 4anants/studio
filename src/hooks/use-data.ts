import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const EMPTY_ARRAY: any[] = [];

export function useData() {
    const { data: users, mutate: mutateUsers } = useSWR('/api/users', fetcher);
    const { data: documents, mutate: mutateDocuments } = useSWR('/api/documents', fetcher);
    const { data: holidays, mutate: mutateHolidays } = useSWR('/api/holidays', fetcher);
    const { data: announcements, mutate: mutateAnnouncements } = useSWR('/api/announcements', fetcher);
    const { data: companies, mutate: mutateCompanies } = useSWR('/api/companies', fetcher);
    const { data: departments, mutate: mutateDepartments } = useSWR('/api/departments', fetcher);
    const { data: documentTypes, mutate: mutateDocumentTypes } = useSWR('/api/document-types', fetcher);
    const { data: deletedDocuments, mutate: mutateDeletedDocuments } = useSWR('/api/documents?deleted=true', fetcher);

    return {
        users: users || EMPTY_ARRAY,
        documents: documents || EMPTY_ARRAY,
        deletedDocuments: deletedDocuments || EMPTY_ARRAY,
        holidays: holidays || EMPTY_ARRAY,
        announcements: announcements || EMPTY_ARRAY,
        companies: companies || EMPTY_ARRAY,
        departments: departments || EMPTY_ARRAY,
        documentTypes: documentTypes || EMPTY_ARRAY,
        loading: !users || !documents,
        mutateUsers,
        mutateDocuments,
        mutateHolidays,
        mutateAnnouncements,
        mutateCompanies,
        mutateDepartments,
        mutateDocumentTypes,
        mutateDeletedDocuments
    };
}
