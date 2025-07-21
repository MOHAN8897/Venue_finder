
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
        {DAYS.map((day) => {
          const dayAvailability = availability[day] || { start: '', end: '', available: false };
          return (
            <div key={day} className="flex items-center gap-4 p-3 border border-border rounded-lg">
              <div className="w-20 font-medium capitalize">{day}</div>
              <Switch
                checked={dayAvailability.available}
                onCheckedChange={(checked) => onChange(day, 'available', checked)}
              />
              {dayAvailability.available && (
                <>
                  {/* Only allow hour selection, no minutes. Use a select dropdown for hours. */}
                  <select
                    value={dayAvailability.start.split(':')[0] || ''}
                    onChange={e => onChange(day, 'start', `${e.target.value}:00`)}
                    className="w-24 border rounded px-2 py-1"
                  >
                    <option value="">Start</option>
                    {[...Array(24).keys()].map(h => (
                      <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                  <span>to</span>
                  <select
                    value={dayAvailability.end.split(':')[0] || ''}
                    onChange={e => onChange(day, 'end', `${e.target.value}:00`)}
                    className="w-24 border rounded px-2 py-1"
                  >
                    <option value="">End</option>
                    {[...Array(24).keys()].map(h => (
                      <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}:00</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
