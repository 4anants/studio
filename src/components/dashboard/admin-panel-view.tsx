'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
    Folder,
    Users,
    Bell,
    Calendar,
    Settings,
    Search,
    Filter,
    Upload,
    FileText,
    LayoutDashboard,
    Shield
} from 'lucide-react'
import useSWR from 'swr'
import type { Document } from '@/lib/types'
import { useState, useMemo } from 'react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function AdminPanelView() {
    const { data: documents = [] } = useSWR<Document[]>('/api/documents', fetcher)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('file-explorer')

    // Group documents by type
    const documentsByType = useMemo(() => {
        const grouped: Record<string, Document[]> = {}
        documents.forEach(doc => {
            const type = doc.type || 'Unassigned'
            if (!grouped[type]) {
                grouped[type] = []
            }
            grouped[type].push(doc)
        })
        return grouped
    }, [documents])

    const formatFileSize = (size?: number | string) => {
        if (!size) return '0 KB'
        const bytes = typeof size === 'string' ? parseFloat(size) : size
        const kb = bytes / 1024
        return `${kb.toFixed(2)} KB`
    }

    return (
        <div className="space-y-6">
            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b pb-4">
                <Button variant="outline" asChild className="flex items-center gap-2">
                    <Link href="/dashboard?role=admin">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>
                </Button>
                <Button className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">
                    <Shield className="h-4 w-4" />
                    Admin Panel
                </Button>
            </div>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Manage employees, documents, announcements, and system settings
                </p>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 lg:w-max bg-transparent p-0 gap-2 h-auto">
                    <TabsTrigger value="file-explorer" className="flex items-center gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md px-4 py-2 transition-all data-[state=active]:animate-gradient-xy data-[state=active]:bg-[length:200%_200%]">
                        <Folder className="h-4 w-4" />
                        <span className="hidden sm:inline">File Explorer</span>
                    </TabsTrigger>
                    <TabsTrigger value="employees" className="flex items-center gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md px-4 py-2 transition-all data-[state=active]:animate-gradient-xy data-[state=active]:bg-[length:200%_200%]">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Employees</span>
                    </TabsTrigger>
                    <TabsTrigger value="announcements" className="flex items-center gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md px-4 py-2 transition-all data-[state=active]:animate-gradient-xy data-[state=active]:bg-[length:200%_200%]">
                        <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">Announcements</span>
                    </TabsTrigger>
                    <TabsTrigger value="holidays" className="flex items-center gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md px-4 py-2 transition-all data-[state=active]:animate-gradient-xy data-[state=active]:bg-[length:200%_200%]">
                        <Calendar className="h-4 w-4" />
                        <span className="hidden sm:inline">Holidays</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2 rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:via-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md px-4 py-2 transition-all data-[state=active]:animate-gradient-xy data-[state=active]:bg-[length:200%_200%]">
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Settings</span>
                    </TabsTrigger>
                </TabsList>

                {/* File Explorer Tab */}
                <TabsContent value="file-explorer" className="space-y-4 mt-6">
                    {/* Search and Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search documents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                All Types
                            </Button>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Bulk Upload
                            </Button>
                            <Button className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">
                                <Upload className="h-4 w-4" />
                                Manual Upload
                            </Button>
                        </div>
                    </div>

                    {/* Document Categories Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(documentsByType).map(([type, docs]) => (
                            <Card key={type} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <Folder className="h-5 w-5 text-blue-600" />
                                        <CardTitle className="text-lg">{type}</CardTitle>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {docs.length} document{docs.length !== 1 ? 's' : ''}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {docs.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No documents
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {docs.slice(0, 3).map(doc => (
                                                <div key={doc.id} className="flex items-start justify-between p-2 rounded hover:bg-accent/50 transition-colors">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{doc.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatFileSize(doc.size)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {docs.length > 3 && (
                                                <p className="text-xs text-muted-foreground text-center pt-2">
                                                    +{docs.length - 3} more
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Other Tabs - Link to Full Admin Interface */}
                <TabsContent value="employees" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Employees Management</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                Access the full employee management interface with all features including:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                <li>Add, edit, and delete employees</li>
                                <li>Bulk upload employees</li>
                                <li>Manage roles and permissions</li>
                                <li>View employee profiles</li>
                            </ul>
                            <Button asChild className="mt-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">
                                <a href="/dashboard?role=admin&view=admin">
                                    Go to Full Admin Interface
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="announcements" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Announcements</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                Access the full announcements management interface with all features including:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                <li>Create and publish announcements</li>
                                <li>Edit existing announcements</li>
                                <li>Delete announcements</li>
                                <li>View announcement history</li>
                            </ul>
                            <Button asChild className="mt-4">
                                <a href="/dashboard?role=admin&view=admin">
                                    Go to Full Admin Interface
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="holidays" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Holidays</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                Access the full holidays management interface with all features including:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                <li>Add company holidays</li>
                                <li>Edit holiday details</li>
                                <li>Delete holidays</li>
                                <li>Set location-specific holidays</li>
                            </ul>
                            <Button asChild className="mt-4">
                                <a href="/dashboard?role=admin&view=admin">
                                    Go to Full Admin Interface
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                Access the full settings interface with all features including:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                                <li>Manage companies</li>
                                <li>Manage departments</li>
                                <li>Manage document types</li>
                                <li>System integrations</li>
                            </ul>
                            <Button asChild className="mt-4">
                                <a href="/dashboard?role=admin&view=admin">
                                    Go to Full Admin Interface
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
