'use client';

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { IdCard } from "./id-card";
import { Settings2, RotateCcw, Save } from "lucide-react";
import type { User, Company } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

// Default configuration based on standard CR80 size and current best fit
const DEFAULT_CONFIG = {
    nameSize: 11, // px
    deptSize: 7, // px
    labelSize: 8, // px
    valueSize: 9, // px
    companySize: 10, // px
    addressSize: 6.5, // px
    photoHeight: 38, // mm
    padding: 1.5, // units
    qrSize: 32, // px

    // Position Offsets (x, y in px)
    photoOffset: { x: 0, y: 0 },
    nameOffset: { x: 0, y: 0 },
    deptOffset: { x: 0, y: 0 },
    detailsOffset: { x: 0, y: 0 },
    footerOffset: { x: 0, y: 0 },
    companyOffset: { x: 0, y: 0 },
    addressOffset: { x: 0, y: 0 },
};

export type IdCardConfig = typeof DEFAULT_CONFIG;

interface IdCardDesignerDialogProps {
    sampleUser: User;
    company: Company;
}

export function IdCardDesignerDialog({ sampleUser, company }: IdCardDesignerDialogProps) {
    const { toast } = useToast();
    const [config, setConfig] = useState<IdCardConfig>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('idCardConfig');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error("Failed to parse saved ID card config", e);
                }
            }
        }
        return DEFAULT_CONFIG;
    });
    const [open, setOpen] = useState(false);

    const handleReset = () => {
        setConfig(DEFAULT_CONFIG);
        localStorage.removeItem('idCardConfig');
        toast({ title: "Reset", description: "Design reset to default settings." });
    };

    const handleSave = () => {
        localStorage.setItem('idCardConfig', JSON.stringify(config));
        toast({ title: "Saved", description: "ID Card design saved locally." });
        // Dispatch event so other components can update if they listen to storage
        window.dispatchEvent(new Event('storage'));
    };

    // Helper to render controls
    const renderControl = (label: string, key: keyof IdCardConfig, min: number, max: number, step: number = 0.5) => (
        <div className="space-y-2">
            <div className="flex justify-between">
                <Label className="text-xs">{label}</Label>
                {/* @ts-ignore */}
                <span className="text-xs text-muted-foreground">{config[key]}</span>
            </div>
            <Slider
                // @ts-ignore
                value={[config[key]]}
                min={min}
                max={max}
                step={step}
                // @ts-ignore
                onValueChange={([val]) => setConfig(prev => ({ ...prev, [key]: val }))}
            />
        </div>
    );

    const renderXYControl = (label: string, key: 'photoOffset' | 'nameOffset' | 'deptOffset' | 'detailsOffset' | 'footerOffset' | 'companyOffset' | 'addressOffset') => (
        <div className="space-y-3 border-b pb-3 last:border-0">
            <Label className="text-xs font-semibold">{label}</Label>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span className="text-[10px] text-muted-foreground">X (Left/Right)</span>
                        <span className="text-[10px] text-muted-foreground">{config[key].x}px</span>
                    </div>
                    <Slider
                        value={[config[key].x]}
                        min={-20}
                        max={20}
                        step={1}
                        onValueChange={([val]) => setConfig(prev => ({ ...prev, [key]: { ...prev[key], x: val } }))}
                    />
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span className="text-[10px] text-muted-foreground">Y (Up/Down)</span>
                        <span className="text-[10px] text-muted-foreground">{config[key].y}px</span>
                    </div>
                    <Slider
                        value={[config[key].y]}
                        min={-20}
                        max={20}
                        step={1}
                        onValueChange={([val]) => setConfig(prev => ({ ...prev, [key]: { ...prev[key], y: val } }))}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Design Card
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>ID Card Designer</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                    {/* Controls */}
                    <div className="space-y-6 border p-4 rounded-lg bg-muted/10 h-full overflow-y-auto max-h-[70vh]">
                        <div className="flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur p-2 -mx-2 rounded z-10 border-b mb-4">
                            <h3 className="font-semibold text-sm">Settings</h3>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleReset} title="Reset to Defaults">
                                    <RotateCcw className="h-3 w-3 mr-1" /> Reset
                                </Button>
                                <Button size="sm" onClick={handleSave} title="Save Configuration">
                                    <Save className="h-3 w-3 mr-1" /> Save
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Typography & Sizes</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {renderControl("Name Size", "nameSize", 8, 16)}
                                    {renderControl("Dept Size", "deptSize", 6, 12)}
                                    {renderControl("Label Size", "labelSize", 6, 12)}
                                    {renderControl("Value Size", "valueSize", 6, 12)}
                                    {renderControl("Company", "companySize", 6, 14)}
                                    {renderControl("Address", "addressSize", 4, 9)}
                                    {renderControl("QR Size", "qrSize", 20, 50, 2)}
                                    {renderControl("Padding", "padding", 0, 4, 0.5)}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Positioning & Layout</h4>
                                <div className="space-y-2">
                                    {renderControl("Photo Height (mm)", "photoHeight", 20, 60, 1)}
                                    {renderXYControl("Photo Position", "photoOffset")}
                                    {renderXYControl("Name Position", "nameOffset")}
                                    {renderXYControl("Department Position", "deptOffset")}
                                    {renderXYControl("Details Area Position", "detailsOffset")}
                                    {renderXYControl("Footer Container", "footerOffset")}
                                    {renderXYControl("Company Name Position", "companyOffset")}
                                    {renderXYControl("Address Position", "addressOffset")}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <strong>Config JSON:</strong>
                            <pre className="mt-2 bg-white p-2 border rounded overflow-x-auto text-[10px]">
                                {JSON.stringify(config, null, 2)}
                            </pre>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="flex flex-col items-center justify-start bg-gray-100 p-8 rounded-lg border sticky top-4">
                        <h3 className="mb-4 text-sm font-medium text-gray-500">Live Preview</h3>
                        <div className="scale-125 transform-origin-top">
                            {/* @ts-ignore */}
                            <IdCard employee={sampleUser} company={company} customConfig={config} />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
