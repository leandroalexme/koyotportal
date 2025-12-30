import { PowerBar, TopNav } from '@/components/shared'

interface DashboardLayoutProps {
  children: React.ReactNode
  params: Promise<{ brand_id: string }>
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { brand_id } = await params

  return (
    <div className="min-h-screen bg-background">
      <PowerBar brandId={brand_id} />
      <TopNav brandId={brand_id} brandName="Koyot" />
      <main className="ml-14 mt-14 min-h-[calc(100vh-3.5rem)]">
        {children}
      </main>
    </div>
  )
}
