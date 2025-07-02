import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { PlusCircle, Tag, Percent } from 'lucide-react';

interface Offer {
    id: number;
    title: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    isActive: boolean;
}

// --- FAKE DATA ---
const fakeOffers: Offer[] = [
    { id: 1, title: 'Summer Special', code: 'SUMMER20', type: 'percentage', value: 20, isActive: true },
    { id: 2, title: 'Weekday Discount', code: 'WEEKDAY500', type: 'fixed', value: 500, isActive: true },
    { id: 3, title: 'Expired Offer', code: 'EXPIRED10', type: 'percentage', value: 10, isActive: false },
];

const OfferCard = React.memo(({ offer }: { offer: Offer }) => (
    <Card className="flex justify-between items-center p-4">
        <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-full ${offer.type === 'percentage' ? 'bg-blue-100' : 'bg-green-100'}`}>
                {offer.type === 'percentage' ? <Percent className="h-5 w-5 text-blue-600"/> : <Tag className="h-5 w-5 text-green-600"/>}
            </div>
            <div>
                <p className="font-semibold">{offer.title}</p>
                <p className="text-sm text-gray-500">Code: {offer.code}</p>
            </div>
        </div>
        <div>
            <Badge variant={offer.isActive ? 'default' : 'destructive'}>
                {offer.isActive ? 'Active' : 'Inactive'}
            </Badge>
        </div>
    </Card>
));

const OfferManager: React.FC = () => {
    const [offers, setOffers] = useState(fakeOffers);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form state for new offer
    const [newOffer, setNewOffer] = useState({ title: '', code: '', type: 'percentage', value: '' });

    const memoizedOffers = useMemo(() => offers, [offers]);
    const handleCreateOffer = useCallback(() => {
        // In a real app, you would call a service to create the offer
        const newId = Math.max(...offers.map(o => o.id), 0) + 1;
        setOffers([...offers, { ...newOffer, id: newId, value: Number(newOffer.value), isActive: true, type: newOffer.type as 'percentage' | 'fixed' }]);
        setIsDialogOpen(false);
        setNewOffer({ title: '', code: '', type: 'percentage', value: '' }); // Reset form
    }, [offers, newOffer]);
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Special Offers & Discounts</CardTitle>
                        <CardDescription>Create and manage promotional offers for this venue.</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" /> Create Offer</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Offer</DialogTitle>
                                <DialogDescription>Fill out the details below to create a new discount.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="title" className="text-right">Title</Label>
                                    <Input id="title" value={newOffer.title} onChange={(e) => setNewOffer({...newOffer, title: e.target.value})} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="code" className="text-right">Code</Label>
                                    <Input id="code" value={newOffer.code} onChange={(e) => setNewOffer({...newOffer, code: e.target.value})} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="type" className="text-right">Type</Label>
                                    <Select value={newOffer.type} onValueChange={(value) => setNewOffer({...newOffer, type: value as 'percentage' | 'fixed'})}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="value" className="text-right">Value</Label>
                                    <Input id="value" type="number" value={newOffer.value} onChange={(e) => setNewOffer({...newOffer, value: e.target.value})} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleCreateOffer}>Create Offer</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {memoizedOffers.map(offer => (
                        <OfferCard key={offer.id} offer={offer} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default OfferManager; 