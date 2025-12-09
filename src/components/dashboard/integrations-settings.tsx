
'use client'
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Wifi, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type SSOConfig = {
    tenantId: string;
    clientId: string;
    clientSecret: string;
};

type DBConfig = {
    type: 'postgresql' | 'mysql' | 'sqlite';
    host: string;
    port: string;
    username: string;
    password: string;
    database: string;
};

export function IntegrationsSettings() {
    const { toast } = useToast();
    const [ssoConfig, setSsoConfig] = useState<SSOConfig>({
        tenantId: '',
        clientId: '',
        clientSecret: '',
    });
    const [dbConfig, setDbConfig] = useState<DBConfig>({
        type: 'postgresql',
        host: 'localhost',
        port: '5432',
        username: '',
        password: '',
        database: '',
    });

    useEffect(() => {
        const storedSSO = localStorage.getItem('ssoConfig');
        if (storedSSO) {
            setSsoConfig(JSON.parse(storedSSO));
        }

        const storedDB = localStorage.getItem('dbConfig');
        if (storedDB) {
            setDbConfig(JSON.parse(storedDB));
        }
    }, []);

    const handleSsoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSsoConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDbConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleDbSelectChange = (value: DBConfig['type']) => {
        setDbConfig(prev => ({ ...prev, type: value }));
    };

    const handleSaveSSO = () => {
        localStorage.setItem('ssoConfig', JSON.stringify(ssoConfig));
        toast({
            title: 'SSO Settings Saved',
            description: 'Office 365 SSO configuration has been updated.',
        });
    };

    const handleSaveDB = () => {
        localStorage.setItem('dbConfig', JSON.stringify(dbConfig));
        toast({
            title: 'Database Settings Saved',
            description: 'Database connection details have been updated.',
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wifi className="h-5 w-5 text-primary" /> Office 365 SSO Configuration
                    </CardTitle>
                    <CardDescription>
                        Enter your Azure App Registration details to enable Single Sign-On.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="tenantId">Tenant ID</Label>
                        <Input
                            id="tenantId"
                            name="tenantId"
                            value={ssoConfig.tenantId}
                            onChange={handleSsoChange}
                            placeholder="Enter Azure Tenant ID"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clientId">Client ID</Label>
                        <Input
                            id="clientId"
                            name="clientId"
                            value={ssoConfig.clientId}
                            onChange={handleSsoChange}
                            placeholder="Enter Application (client) ID"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clientSecret">Client Secret</Label>
                        <Input
                            id="clientSecret"
                            name="clientSecret"
                            type="password"
                            value={ssoConfig.clientSecret}
                            onChange={handleSsoChange}
                            placeholder="Enter Client Secret"
                        />
                    </div>
                    <Button onClick={handleSaveSSO}>
                        <Save className="mr-2 h-4 w-4" /> Save SSO Configuration
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" /> Database Configuration
                    </CardTitle>
                    <CardDescription>
                        Configure the connection to your application's database.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dbType">Database Type</Label>
                            <Select value={dbConfig.type} onValueChange={handleDbSelectChange}>
                                <SelectTrigger id="dbType">
                                    <SelectValue placeholder="Select DB Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                                    <SelectItem value="mysql">MySQL</SelectItem>
                                    <SelectItem value="sqlite">SQLite</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="dbHost">Host</Label>
                            <Input
                                id="dbHost"
                                name="host"
                                value={dbConfig.host}
                                onChange={handleDbChange}
                                placeholder="e.g., localhost or an IP address"
                            />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dbPort">Port</Label>
                            <Input
                                id="dbPort"
                                name="port"
                                value={dbConfig.port}
                                onChange={handleDbChange}
                                placeholder="e.g., 5432"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dbName">Database Name</Label>
                            <Input
                                id="dbName"
                                name="database"
                                value={dbConfig.database}
                                onChange={handleDbChange}
                                placeholder="Name of the database"
                            />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dbUser">Username</Label>
                            <Input
                                id="dbUser"
                                name="username"
                                value={dbConfig.username}
                                onChange={handleDbChange}
                                placeholder="Database user"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dbPass">Password</Label>
                            <Input
                                id="dbPass"
                                name="password"
                                type="password"
                                value={dbConfig.password}
                                onChange={handleDbChange}
                                placeholder="Database password"
                            />
                        </div>
                    </div>
                    <Button onClick={handleSaveDB}>
                        <Save className="mr-2 h-4 w-4" /> Save Database Configuration
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
    