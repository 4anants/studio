import { Button } from "@/components/ui/button"
import { Download, Upload, FileDown } from "lucide-react"
import { useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ImportExportButtonsProps {
    onExport: () => void;
    onImport: (data: any[]) => Promise<void>;
    onDownloadSample: () => void;
    itemName: string;
}

export function ImportExportButtons({ onExport, onImport, onDownloadSample, itemName }: ImportExportButtonsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [isImporting, setIsImporting] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                if (!text) throw new Error("Empty file");

                // Simple CSV Parser
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error("File must contain a header and at least one row");

                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const result = [];

                for (let i = 1; i < lines.length; i++) {
                    const currentline = lines[i].split(',').map(cell => cell.trim().replace(/^"|"$/g, '')); // Basic split, doesn't handle commas in quotes perfectly but good for simple data
                    if (currentline.length === headers.length) {
                        const obj: any = {};
                        for (let j = 0; j < headers.length; j++) {
                            obj[headers[j]] = currentline[j];
                        }
                        result.push(obj);
                    }
                }

                await onImport(result);
                toast({ title: "Import Successful", description: `Imported ${result.length} ${itemName} items.` });
            } catch (error) {
                console.error(error);
                toast({ variant: "destructive", title: "Import Failed", description: "Could not parse file or import data." });
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
                setIsImporting(false);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                size="sm"
                onClick={onExport}
                title={`Export ${itemName}`}
                className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0"
            >
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>

            <div className="relative">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv"
                    className="hidden"
                />
                <Button
                    size="sm"
                    disabled={isImporting}
                    title={`Import ${itemName}`}
                    className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0"
                    onClick={() => { }} // We use the dropdown trigger instead
                    asChild
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" className="rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-md hover:from-blue-600 hover:to-pink-600 transition-all transform hover:scale-105 animate-gradient-xy bg-[length:200%_200%] border-0">
                                <Upload className="mr-2 h-4 w-4" />
                                {isImporting ? 'Importing...' : 'Import'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onDownloadSample}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Download Sample
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload CSV
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Button>
            </div>
        </div>
    )
}
