
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

    useEffect(() => {
        const storedSSO = localStorage.getItem('ssoConfig');
        if (storedSSO) {
            setSsoConfig(JSON.parse(storedSSO));
        }
    }, []);

    const handleSsoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSsoConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSaveSSO = () => {
        localStorage.setItem('ssoConfig', JSON.stringify(ssoConfig));
        toast({
            title: 'SSO Settings Saved',
            description: 'Office 365 SSO configuration has been updated.',
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
        </div>
    );
}

