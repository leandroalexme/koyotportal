import { PowerBar, TopNav } from '@/components/shared'
import { createClient } from '@/lib/supabase/server'

interface DashboardLayoutProps {
  children: React.ReactNode
  params: Promise<{ brand_id: string }>
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { brand_id } = await params
  
  const supabase = await createClient()
  const { data: brand } = await supabase
    .from('brands')
    .select('name')
    .eq('id', brand_id)
    .single()

  const brandName = brand?.name || 'Marca'

  return (
    <div className="min-h-screen bg-background">
      <PowerBar brandId={brand_id} />
      <TopNav brandId={brand_id} brandName={brandName} />
      <main className="ml-14 mt-14 min-h-[calc(100vh-3.5rem)]">
        {children}
      </main>
    </div>
  )
}
