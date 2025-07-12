
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

interface AvailabilitySectionProps {
  availability: Record<string, { start: string; end: string; available: boolean }>;
  onChange: (day: string, field: 'start' | 'end' | 'available', value: string | boolean) => void;
}

export function AvailabilitySection({ availability, onChange }: AvailabilitySectionProps) {
  return (
    <div className="space-y-4">
      <Label>Weekly Availability</Label>
      <div className="space-y-3">
        {DAYS.map((day) => (
          <div key={day} className="flex items-center gap-4 p-3 border border-border rounded-lg">
            <div className="w-20 font-medium capitalize">{day}</div>
            <Switch
              checked={availability[day].available}
              onCheckedChange={(checked) => onChange(day, 'available', checked)}
            />
            {availability[day].available && (
              <>
                <Input
                  type="time"
                  value={availability[day].start}
                  onChange={(e) => onChange(day, 'start', e.target.value)}
                  className="w-32"
                />
                <span>to</span>
                <Input
                  type="time"
                  value={availability[day].end}
                  onChange={(e) => onChange(day, 'end', e.target.value)}
                  className="w-32"
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
