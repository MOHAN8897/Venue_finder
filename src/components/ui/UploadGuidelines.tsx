import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import { Separator } from './separator';
import { 
  Info, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight,
  Image,
  Video,
  Upload,
  Lightbulb,
  Target,
  Zap,
  Shield,
  Eye,
  Smartphone,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadGuidelinesProps {
  title?: string;
  showExamples?: boolean;
  showFAQ?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export interface GuidelineSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  examples?: {
    good: string;
    bad: string;
    description: string;
  }[];
}

const UploadGuidelines: React.FC<UploadGuidelinesProps> = ({
  title = "Professional Upload Guidelines",
  showExamples = true,
  showFAQ = true,
  className,
  variant = 'default'
}) => {
  const [openSections, setOpenSections] = useState<string[]>(['requirements', 'best-practices']);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const guidelines: GuidelineSection[] = [
    {
      id: 'requirements',
      title: 'Technical Requirements',
      icon: <Target className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Image Requirements
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>Minimum 3 photos, maximum 10 photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>Maximum file size: 5MB per photo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>Supported formats: JPG, PNG, WebP</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>Recommended aspect ratio: 16:9 (widescreen)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>Minimum resolution: 1200x675 pixels</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video Requirements
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>YouTube or Vimeo links only</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>High-quality video content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Showcase venue features and atmosphere</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Keep videos under 5 minutes for best engagement</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'best-practices',
      title: 'Best Practices',
      icon: <Lightbulb className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-amber-700 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Photo Best Practices
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-green-800">High Quality</span>
                    <p className="text-sm text-green-700">Use well-lit, sharp images that showcase your venue clearly</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-green-800">Multiple Angles</span>
                    <p className="text-sm text-green-700">Show different perspectives and key areas of your venue</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-green-800">Setup Examples</span>
                    <p className="text-sm text-green-700">Include photos of events or setups to show potential</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-green-800">Unique Features</span>
                    <p className="text-sm text-green-700">Highlight what makes your venue special</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-red-700 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                What to Avoid
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-red-800">Blurry Images</span>
                    <p className="text-sm text-red-700">Avoid low-quality or out-of-focus photos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-red-800">Poor Lighting</span>
                    <p className="text-sm text-red-700">Dark or overexposed images don't showcase well</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-red-800">Cluttered Spaces</span>
                    <p className="text-sm text-red-700">Clean, organized spaces look more professional</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-red-800">Generic Shots</span>
                    <p className="text-sm text-red-700">Show what makes your venue unique</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      examples: showExamples ? {
        good: '/examples/good-venue-photo.jpg',
        bad: '/examples/bad-venue-photo.jpg',
        description: 'Good photos are well-lit, show the full space, and highlight unique features. Bad photos are dark, cluttered, or don\'t showcase the venue effectively.'
      } : undefined
    },
    {
      id: 'optimization',
      title: 'Image Optimization',
      icon: <Zap className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Automatic Optimization
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              Our system automatically optimizes your images for the best performance:
            </p>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-blue-600" />
                <span>Automatic cropping to 16:9 aspect ratio</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-blue-600" />
                <span>WebP conversion for faster loading</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-blue-600" />
                <span>Quality optimization while maintaining visual appeal</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-blue-600" />
                <span>Thumbnail generation for gallery previews</span>
              </li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const faqItems = [
    {
      question: "Why is 16:9 aspect ratio important?",
      answer: "16:9 aspect ratio ensures your images display consistently across all devices and platforms, providing a professional, uniform appearance that matches industry standards used by major booking platforms."
    },
    {
      question: "What happens if my images don't meet the requirements?",
      answer: "Our system will automatically optimize your images to meet the requirements. You'll see warnings for any issues, and we'll guide you through the process of improving your uploads."
    },
    {
      question: "Can I edit my images after uploading?",
      answer: "Yes! You can use our built-in image cropper to adjust aspect ratios, rotate images, or make other edits directly in the upload interface."
    },
    {
      question: "How many images should I upload?",
      answer: "We recommend uploading 5-8 high-quality images that showcase different aspects of your venue. This gives potential customers a comprehensive view while maintaining fast loading times."
    },
    {
      question: "What makes a good featured image?",
      answer: "Your featured image should be your best shot - well-lit, showing the main space, and highlighting what makes your venue special. It's the first image visitors will see."
    }
  ];

  if (variant === 'compact') {
    return (
      <Card className={cn("bg-gradient-to-r from-blue-50 to-indigo-50", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm">Quick Tips</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>3-10 photos, 5MB each</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>16:9 aspect ratio</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>JPG, PNG, WebP</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span>Well-lit, clear shots</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Info className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Guidelines Sections */}
          <div className="space-y-4">
            {guidelines.map((section) => (
              <Collapsible
                key={section.id}
                open={openSections.includes(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto bg-white/50 hover:bg-white/70"
                  >
                    <div className="flex items-center gap-3">
                      {section.icon}
                      <span className="font-semibold">{section.title}</span>
                    </div>
                    {openSections.includes(section.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <div className="pt-4">
                    {section.content}
                    {section.examples && (
                      <div className="mt-4 p-4 bg-white/50 rounded-lg">
                        <h5 className="font-medium mb-2">Visual Examples</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="aspect-video bg-green-100 rounded-lg mb-2 flex items-center justify-center">
                              <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <span className="text-sm font-medium text-green-700">Good Example</span>
                          </div>
                          <div className="text-center">
                            <div className="aspect-video bg-red-100 rounded-lg mb-2 flex items-center justify-center">
                              <XCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <span className="text-sm font-medium text-red-700">Avoid This</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                          {section.examples.description}
                        </p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>

          {/* FAQ Section */}
          {showFAQ && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Frequently Asked Questions
                </h3>
                <div className="space-y-3">
                  {faqItems.map((item, index) => (
                    <Collapsible key={index}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-3 h-auto bg-white/50 hover:bg-white/70 text-left"
                        >
                          <span className="font-medium text-sm">{item.question}</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-3 pb-3">
                        <p className="text-sm text-muted-foreground pt-2">{item.answer}</p>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Responsive Design Note */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
              <Smartphone className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Mobile-Friendly</h4>
                <p className="text-sm text-amber-800">
                  These guidelines work great on all devices. Upload from your phone, tablet, or computer for the best results.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadGuidelines; 