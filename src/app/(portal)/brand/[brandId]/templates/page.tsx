import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const templates = [
  {
    id: 1,
    name: 'Social Media Post',
    category: 'Social',
    formats: ['Instagram', 'LinkedIn', 'Twitter'],
  },
  {
    id: 2,
    name: 'Email Header',
    category: 'Email',
    formats: ['Newsletter', 'Promotional'],
  },
  {
    id: 3,
    name: 'Presentation',
    category: 'Documents',
    formats: ['16:9', '4:3'],
  },
  {
    id: 4,
    name: 'Business Card',
    category: 'Print',
    formats: ['Standard', 'Square'],
  },
  {
    id: 5,
    name: 'Banner Ad',
    category: 'Digital',
    formats: ['Leaderboard', 'Skyscraper', 'Rectangle'],
  },
  {
    id: 6,
    name: 'Letterhead',
    category: 'Print',
    formats: ['A4', 'Letter'],
  },
]

export default function TemplatesPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="mt-2 text-muted-foreground">
            Pre-designed templates for consistent brand application
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="group cursor-pointer transition-shadow hover:shadow-md"
          >
            <CardContent className="p-0">
              <div className="flex aspect-video items-center justify-center bg-muted">
                <span className="text-sm text-muted-foreground">Preview</span>
              </div>
            </CardContent>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {template.category}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {template.formats.map((format) => (
                  <Badge key={format} variant="secondary" className="text-xs">
                    {format}
                  </Badge>
                ))}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
