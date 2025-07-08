import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ApprovalSettings {
  autoApproveAll: boolean;
  rules: {
    maxGroupSizeEnabled: boolean;
    maxGroupSize: number;
    requireFullPayment: boolean;
    blockLastMinute: boolean;
    blockLastMinuteHours: number;
  };
}

// --- FAKE DATA ---
const fakeSettings: ApprovalSettings = {
  autoApproveAll: false,
  rules: {
    maxGroupSizeEnabled: true,
    maxGroupSize: 20,
    requireFullPayment: true,
    blockLastMinute: true,
    blockLastMinuteHours: 24,
  },
};

const BookingApprovalManager: React.FC = () => {
  const [settings, setSettings] = useState(fakeSettings);

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // In a real app, call a service to save these settings to the backend
    toast.success('Approval settings have been saved!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automated Booking Approvals</CardTitle>
        <CardDescription>
          Set rules to automatically approve bookings and save time. Bookings that don't meet these criteria will require manual approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <Label htmlFor="auto-approve-all" className="font-semibold text-lg">
            Enable Auto-Approval System
          </Label>
          <Switch
            id="auto-approve-all"
            checked={settings.autoApproveAll}
            onCheckedChange={(checked) => setSettings({ ...settings, autoApproveAll: checked })}
          />
        </div>

        {settings.autoApproveAll && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-md font-semibold text-gray-800">Approval Rules</h3>
            
            {/* Rule: Max Group Size */}
            <div className="flex items-center justify-between">
              <Label htmlFor="max-group-switch">Auto-approve if group size is less than:</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="max-group-switch"
                  checked={settings.rules.maxGroupSizeEnabled}
                  onCheckedChange={(checked) => setSettings(s => ({...s, rules: {...s.rules, maxGroupSizeEnabled: checked }}))}
                />
                <Input
                  type="number"
                  className="w-20"
                  disabled={!settings.rules.maxGroupSizeEnabled}
                  value={settings.rules.maxGroupSize}
                  onChange={(e) => setSettings(s => ({...s, rules: {...s.rules, maxGroupSize: parseInt(e.target.value) }}))}
                />
              </div>
            </div>

            {/* Rule: Require Full Payment */}
            <div className="flex items-center justify-between">
              <Label htmlFor="require-payment-switch">Auto-approve only if booking is paid in full</Label>
              <Switch
                id="require-payment-switch"
                checked={settings.rules.requireFullPayment}
                onCheckedChange={(checked) => setSettings(s => ({...s, rules: {...s.rules, requireFullPayment: checked }}))}
              />
            </div>
            
            {/* Rule: Block Last-Minute */}
            <div className="flex items-center justify-between">
              <Label htmlFor="block-last-minute-switch">Don't auto-approve bookings made within:</Label>
               <div className="flex items-center space-x-2">
                <Switch
                  id="block-last-minute-switch"
                  checked={settings.rules.blockLastMinute}
                  onCheckedChange={(checked) => setSettings(s => ({...s, rules: {...s.rules, blockLastMinute: checked }}))}
                />
                <Input
                  type="number"
                  className="w-20"
                  disabled={!settings.rules.blockLastMinute}
                  value={settings.rules.blockLastMinuteHours}
                  onChange={(e) => setSettings(s => ({...s, rules: {...s.rules, blockLastMinuteHours: parseInt(e.target.value) }}))}
                />
                 <span className="text-sm text-gray-500">hours</span>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end pt-4">
            <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingApprovalManager; 