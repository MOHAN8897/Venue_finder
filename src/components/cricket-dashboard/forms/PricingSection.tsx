
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PricingSectionProps {
  formData: {
    hourlyRate: string;
    peakHourRate: string;
  };
  onChange: (field: string, value: string) => void;
}

export function PricingSection({ formData, onChange }: PricingSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
        <Input
          id="hourlyRate"
          type="number"
          value={formData.hourlyRate}
          onChange={(e) => onChange('hourlyRate', e.target.value)}
          placeholder="800"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="peakHourRate">Peak Hour Rate (₹)</Label>
        <Input
          id="peakHourRate"
          type="number"
          value={formData.peakHourRate}
          onChange={(e) => onChange('peakHourRate', e.target.value)}
          placeholder="1200"
          required
        />
      </div>
    </div>
  );
}
