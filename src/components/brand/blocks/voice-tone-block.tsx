'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BlockProps } from './block-registry'
import type { VoiceToneContent } from '@/types'

export default function VoiceToneBlock({ block }: BlockProps) {
  const content = block.content as VoiceToneContent

  return (
    <Card>
      {(block.title || block.description) && (
        <CardHeader>
          {block.title && <CardTitle>{block.title}</CardTitle>}
          {block.description && <CardDescription>{block.description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="space-y-8">
        {content.voice && content.voice.length > 0 && (
          <div>
            <h4 className="mb-4 text-sm font-medium text-muted-foreground">
              Brand Voice
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.voice.map((item) => (
                <div key={item.trait} className="rounded-lg border p-4">
                  <h5 className="mb-2 font-medium">{item.trait}</h5>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {item.examples && item.examples.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {item.examples.map((example, i) => (
                        <p key={i} className="text-sm italic text-muted-foreground">
                          &ldquo;{example}&rdquo;
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {content.tone && content.tone.length > 0 && (
          <div>
            <h4 className="mb-4 text-sm font-medium text-muted-foreground">
              Tone by Context
            </h4>
            <div className="space-y-3">
              {content.tone.map((item) => (
                <div
                  key={item.context}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div>
                    <h5 className="font-medium">{item.context}</h5>
                    {item.example && (
                      <p className="mt-1 text-sm italic text-muted-foreground">
                        &ldquo;{item.example}&rdquo;
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">{item.tone}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.keywords && content.keywords.length > 0 && (
          <div>
            <h4 className="mb-4 text-sm font-medium text-muted-foreground">
              Keywords
            </h4>
            <div className="flex flex-wrap gap-2">
              {content.keywords.map((keyword) => (
                <Badge key={keyword} variant="outline">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
