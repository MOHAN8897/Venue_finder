import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, Clock, XCircle, Upload, FileText } from 'lucide-react';
import { Progress } from './ui/progress';
import { Label } from './ui/label';

interface Document {
    id: string;
    name: string;
    status: 'approved' | 'pending' | 'rejected' | 'missing';
    fileName?: string;
    rejectionReason?: string;
}

// --- FAKE DATA ---
const fakeDocuments: Document[] = [
    { id: 'license', name: 'Business License', status: 'approved', fileName: 'business-license.pdf' },
    { id: 'insurance', name: 'Insurance Certificate', status: 'pending', fileName: 'insurance-cert-2024.pdf' },
    { id: 'fire_safety', name: 'Fire Safety Permit', status: 'rejected', rejectionReason: 'Document is expired.' },
    { id: 'food_license', name: 'Food & Beverage License', status: 'missing' },
];

const StatusIcon = ({ status }: { status: Document['status'] }) => {
    switch (status) {
        case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
        case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
        default: return <FileText className="h-5 w-5 text-gray-400" />;
    }
};

const ComplianceManager: React.FC = () => {
    const [documents, setDocuments] = useState(fakeDocuments);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log(`Uploading ${file.name} for document ${docId}`);
        // In a real app, call a service to upload the file.
        // On success, update the document status to 'pending'.
        setDocuments(docs => docs.map(doc => 
            doc.id === docId ? { ...doc, status: 'pending', fileName: file.name } : doc
        ));
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const approvedCount = documents.filter(d => d.status === 'approved').length;
    const progress = (approvedCount / documents.length) * 100;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Compliance & Documents</CardTitle>
                <CardDescription>Upload and manage required legal and safety documents.</CardDescription>
                <div className="pt-2">
                    <Label className="text-sm font-medium">Overall Compliance</Label>
                    <Progress value={progress} className="mt-1" />
                    <p className="text-xs text-gray-500 mt-1">{approvedCount} of {documents.length} documents approved.</p>
                </div>
            </CardHeader>
            <CardContent>
                <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e, 'some-doc-id')} className="hidden" />
                <div className="space-y-4">
                    {documents.map(doc => (
                        <Card key={doc.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <StatusIcon status={doc.status} />
                                <div>
                                    <p className="font-semibold">{doc.name}</p>
                                    {doc.fileName && <p className="text-xs text-gray-500">{doc.fileName}</p>}
                                    {doc.status === 'rejected' && doc.rejectionReason && (
                                        <p className="text-xs text-red-500">Reason: {doc.rejectionReason}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Badge variant={doc.status === 'approved' ? 'default' : doc.status === 'pending' ? 'secondary' : 'destructive'}>
                                    {doc.status}
                                </Badge>
                                {doc.status !== 'approved' && (
                                     <Button size="sm" variant="outline" onClick={() => triggerFileUpload()}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {doc.status === 'missing' ? 'Upload' : 'Re-upload'}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default ComplianceManager; 