import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-6xl font-bold tracking-tighter">KOYOT</h1>
        <p className="max-w-md text-lg text-muted-foreground">
          AI-powered brand management ecosystem. Your single source of truth for visual identities.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/brand/demo">
              Enter Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
