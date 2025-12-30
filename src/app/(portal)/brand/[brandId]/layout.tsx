import { BrandShell } from '@/components/layout'

interface BrandLayoutProps {
  children: React.ReactNode
  params: Promise<{ brandId: string }>
}

export default async function BrandLayout({
  children,
  params,
}: BrandLayoutProps) {
  const { brandId } = await params

  return (
    <BrandShell brandId={brandId} brandName="Koyot">
      {children}
    </BrandShell>
  )
}
