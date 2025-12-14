# Bulk Selection Implementation Guide for Deleted Items

## Summary
Add bulk selection checkboxes and "Delete Selected" buttons to all deleted item tabs:
- Companies
- Departments  
- Document Types
- Documents
- Users

## Already Implemented ✅
- Announcements (with bulk selection)
- Holidays (with bulk selection)

## Implementation Pattern

For each deleted item tab, you need to:

### 1. Add Bulk Delete Handler (after line 785 in admin-view.tsx)

```typescript
const handleBulkPermanentDelete[EntityName] = useCallback(async () => {
    try {
        const responses = await Promise.all(selectedDeleted[Entity]Ids.map(id =>
            fetch(`/api/[entity-route]?id=${id}`, { method: 'DELETE' })
        ));
        
        const failed = responses.find(r => !r.ok);
        if (failed) {
            const errorData = await failed.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to delete some [entities]');
        }

        await mutate[Entities]();
        setSelectedDeleted[Entity]Ids([]);
        toast({
            title: "[Entities] Deleted",
            description: `${selectedDeleted[Entity]Ids.length} [entity](s) have been permanently deleted.`
        });
        setIsBulkPermanentDelete[Entities]DialogOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete some [entities]' });
    }
}, [selectedDeleted[Entity]Ids, mutate[Entities], toast]);
```

### 2. Update CardHeader (add bulk delete button)

```tsx
<CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
    <div>
        <CardTitle>Deleted [Entities]</CardTitle>
        <CardDescription>A list of all deleted [entities]. You can restore or permanently delete them here.</CardDescription>
    </div>
    {selectedDeleted[Entity]Ids.length > 0 && (
        <Button variant="destructive" onClick={() => setIsBulkPermanentDelete[Entities]DialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Selected ({selectedDeleted[Entity]Ids.length})
        </Button>
    )}
</CardHeader>
```

### 3. Add Checkbox Column to TableHeader

```tsx
<TableHeader>
    <TableRow>
        <TableHead className="w-[50px]">
            <Checkbox
                checked={filteredDeleted[Entities].length > 0 && selectedDeleted[Entity]Ids.length === filteredDeleted[Entities].length}
                onCheckedChange={(checked) => {
                    if (checked) {
                        setSelectedDeleted[Entity]Ids(filteredDeleted[Entities].map(item => item.id));
                    } else {
                        setSelectedDeleted[Entity]Ids([]);
                    }
                }}
            />
        </TableHead>
        {/* existing columns */}
    </TableRow>
</TableHeader>
```

### 4. Add Checkbox to Each Row

```tsx
<TableRow key={item.id}>
    <TableCell>
        <Checkbox
            checked={selectedDeleted[Entity]Ids.includes(item.id)}
            onCheckedChange={(checked) => {
                if (checked) {
                    setSelectedDeleted[Entity]Ids(prev => [...prev, item.id]);
                } else {
                    setSelectedDeleted[Entity]Ids(prev => prev.filter(id => id !== item.id));
                }
            }}
        />
    </TableCell>
    {/* existing cells */}
</TableRow>
```

### 5. Update Empty State colspan

```tsx
<TableCell colSpan={[original_count + 1]} className="text-center text-muted-foreground">
    No deleted [entities] found.
</TableCell>
```

### 6. Add Bulk Delete Confirmation Dialog (after line 2650)

```tsx
{/* Bulk Delete [Entities] Confirmation Dialog */}
<AlertDialog open={isBulkPermanentDelete[Entities]DialogOpen} onOpenChange={setIsBulkPermanentDelete[Entities]DialogOpen}>
    <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action will permanently delete the selected {selectedDeleted[Entity]Ids.length} [entity](s). This action cannot be undone.
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkPermanentDelete[Entities]} className="bg-destructive hover:bg-destructive/90">
                Delete Permanently
            </AlertDialogAction>
        </AlertDialogFooter>
    </AlertDialogContent>
</AlertDialog>
```

## Specific Replacements Needed

### Companies (Line ~2244-2288)
- Entity: Company/Companies
- Route: /api/companies
- Mutate: mutateCompanies
- Filter: filteredDeletedCompanies
- State: selectedDeletedCompanyIds, setSelectedDeletedCompanyIds
- Dialog: isBulkPermanentDeleteCompaniesDialogOpen

### Departments (Line ~2289-2335)
- Entity: Department/Departments
- Route: /api/departments
- Mutate: mutateDepartments
- Filter: filteredDeletedDepartments
- State: selectedDeletedDepartmentIds, setSelectedDeletedDepartmentIds
- Dialog: isBulkPermanentDeleteDepartmentsDialogOpen

### Document Types (Line ~2336-2383)
- Entity: DocType/DocTypes
- Route: /api/document-types
- Mutate: mutateDocumentTypes
- Filter: filteredDeletedDocTypes
- State: selectedDeletedDocTypeIds, setSelectedDeletedDocTypeIds
- Dialog: isBulkPermanentDeleteDocTypesDialogOpen

### Documents (Line ~2384-2403)
- Entity: Document/Documents
- Route: /api/documents
- Mutate: mutateDocuments
- Filter: filteredDeletedDocs
- State: selectedDeletedDocumentIds, setSelectedDeletedDocumentIds
- Dialog: isBulkPermanentDeleteDocumentsDialogOpen
- Note: Uses DocumentList component, may need custom implementation

### Users (Line ~2404-2455)
- Entity: User/Users
- Route: /api/users
- Mutate: mutateUsers
- Filter: filteredDeletedUsers
- State: selectedDeletedUserIds, setSelectedDeletedUserIds
- Dialog: isBulkPermanentDeleteUsersDialogOpen

## State Variables Already Added ✅
All necessary state variables have been added at lines 145-158:
- selectedDeletedCompanyIds
- selectedDeletedDepartmentIds
- selectedDeletedDocTypeIds
- selectedDeletedDocumentIds
- selectedDeletedUserIds
- All corresponding dialog open states

## Next Steps
1. Add bulk delete handlers (5 functions)
2. Update each deleted item tab UI (5 sections)
3. Add bulk delete dialogs (5 dialogs)

Total: ~500 lines of code to add across the file.
