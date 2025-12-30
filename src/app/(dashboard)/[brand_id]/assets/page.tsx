import { Upload, Filter, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const assetCategories = [
  { id: 'all', label: 'All Assets', count: 156 },
  { id: 'logos', label: 'Logos', count: 24 },
  { id: 'images', label: 'Images', count: 89 },
  { id: 'documents', label: 'Documents', count: 43 },
]

export default function AssetsPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Assets</h1>
          <p className="mt-2 text-muted-foreground">
            Digital Asset Management for your brand
          </p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <Input placeholder="Search assets..." className="max-w-sm" />
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="recent">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-md border">
            <Button variant="ghost" size="icon" className="rounded-r-none">
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-l-none">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          {assetCategories.map((category) => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.label}
              <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                {category.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">
                    Asset {i + 1}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate text-sm font-medium">
                    asset-{i + 1}.png
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {assetCategories.slice(1).map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <p className="text-muted-foreground">
                {category.label} will appear here
              </p>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
