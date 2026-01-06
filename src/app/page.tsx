import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          <span className="text-xl font-bold tracking-tight">Koyot</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Criar conta</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
            Crie marcas completas com IA
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Transforme um briefing simples em uma identidade visual profissional. 
            Cores, tipografia, tom de voz — tudo gerado em segundos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/signup">
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Já tenho conta</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/demo">Ver Demo</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-4xl">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="font-semibold mb-2">Paleta de Cores</h3>
            <p className="text-sm text-muted-foreground">
              Cores estratégicas com justificativa e aplicação
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✍️</span>
            </div>
            <h3 className="font-semibold mb-2">Tipografia</h3>
            <p className="text-sm text-muted-foreground">
              Fontes do Google Fonts prontas para usar
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="font-semibold mb-2">Voz e Tom</h3>
            <p className="text-sm text-muted-foreground">
              Diretrizes de comunicação da marca
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-border/50 text-center text-sm text-muted-foreground">
        <p>Powered by Gemini 2.0 • Koyot Genesis Engine</p>
      </footer>
    </div>
  )
}
