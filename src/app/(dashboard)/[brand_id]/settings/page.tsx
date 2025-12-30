import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Brand Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Configure your brand profile and AI context
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Brand Profile</CardTitle>
            <CardDescription>
              Basic information about your brand
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Brand Name</Label>
                <Input id="name" placeholder="Enter brand name" defaultValue="Koyot" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input id="slug" placeholder="brand-slug" defaultValue="koyot" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mission">Mission</Label>
              <Textarea
                id="mission"
                placeholder="What is your brand's mission?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vision">Vision</Label>
              <Textarea
                id="vision"
                placeholder="What is your brand's vision?"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Context (Brand DNA)</CardTitle>
            <CardDescription>
              Provide context for AI-generated content. This helps the AI understand your brand&apos;s personality and generate more relevant content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-context">AI Context Prompt</Label>
              <Textarea
                id="ai-context"
                placeholder="Describe your brand's personality, target audience, industry, and any specific guidelines the AI should follow..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="values">Brand Values (comma-separated)</Label>
              <Input
                id="values"
                placeholder="Innovation, Trust, Simplicity"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portal Settings</CardTitle>
            <CardDescription>
              Configure how your brand portal appears to visitors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Portal</Label>
                <p className="text-sm text-muted-foreground">
                  Allow anyone to view your brand guidelines
                </p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Asset Downloads</Label>
                <p className="text-sm text-muted-foreground">
                  Allow visitors to download brand assets
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
