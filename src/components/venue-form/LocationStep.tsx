import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface LocationStepProps {
  mapEmbedCode: string;
  setMapEmbedCode: (code: string) => void;
  isValid: boolean;
}

export default function LocationStep({ mapEmbedCode, setMapEmbedCode }: LocationStepProps) {
  let isValidIframe = false;
  let iframeSrc = '';
  if (mapEmbedCode) {
    // Check for valid Google Maps iframe or URL
    if (/^<iframe[\s\S]*<\/iframe>$/.test(mapEmbedCode.trim())) {
      isValidIframe = true;
    } else if (/^https:\/\/(www\.)?google\.com\/maps/.test(mapEmbedCode.trim())) {
      isValidIframe = true;
      iframeSrc = mapEmbedCode.trim();
    }
  }
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Venue Location Map</CardTitle>
      </CardHeader>
      <CardContent>
      <div className="space-y-2">
          <Label htmlFor="mapEmbedCode" className="text-sm font-medium">
            Google Maps Embed Code
        </Label>
          <Input
          id="mapEmbedCode"
            value={mapEmbedCode}
            onChange={e => setMapEmbedCode(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
            placeholder="Paste your Google Maps embed code or URL here"
            className="transition-all duration-200 focus:shadow-md"
        />
          {mapEmbedCode && (
            <div className="mt-4 border rounded overflow-hidden">
              <div className="aspect-video w-full">
                {isValidIframe ? (
                  /^<iframe[\s\S]*<\/iframe>$/.test(mapEmbedCode.trim()) ? (
                    <div dangerouslySetInnerHTML={{ __html: mapEmbedCode }} />
                  ) : (
                    <iframe
                      src={iframeSrc}
                      title="Venue Location Map Preview"
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  )
                ) : (
                  <div className="text-sm text-red-600">Invalid embed code or URL. Please paste a valid Google Maps &lt;iframe&gt; or Google Maps URL.</div>
                )}
              </div>
        </div>
      )}
        </div>
      </CardContent>
    </Card>
  );
}