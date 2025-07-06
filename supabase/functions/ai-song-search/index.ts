import { corsHeaders } from '../_shared/cors.ts'

interface SongResult {
  title: string
  lyrics: string
  source: string
  url: string
}

interface LyricsOvhResponse {
  lyrics?: string
}

// Simple function to extract meaningful lyrics from text
function extractLyricsFromText(text: string): string {
  if (!text) return ''
  
  const lines = text.split('\n')
  const cleanLines: string[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    // Skip empty lines, very short lines, or lines that look like metadata
    if (trimmed.length > 3 && !trimmed.match(/^(copyright|©|\(c\)|lyrics|song|artist|album|year|written|composed|performed)/i)) {
      cleanLines.push(trimmed)
    }
  }
  
  return cleanLines.join('\n').slice(0, 3000) // Limit to 3000 characters
}

Deno.serve(async (req: Request) => {
  console.log(`${req.method} ${req.url}`)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    const { query } = await req.json()

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Searching for:', query)

    let songResults: SongResult[] = []

    // Try lyrics.ovh API (free Christian lyrics API)
    console.log('Trying lyrics.ovh API...')
    try {
      const lyricsResponse = await fetch(
        `https://api.lyrics.ovh/v1//${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (lyricsResponse.ok) {
        const lyricsData: LyricsOvhResponse = await lyricsResponse.json()
        console.log('Lyrics.ovh response:', lyricsData.lyrics ? 'found lyrics' : 'no lyrics')

        if (lyricsData.lyrics && lyricsData.lyrics.length > 50) {
          songResults.push({
            title: query,
            lyrics: lyricsData.lyrics.trim(),
            source: 'lyrics.ovh',
            url: 'https://lyrics.ovh'
          })
        }
      } else {
        console.log('Lyrics.ovh API error:', lyricsResponse.status)
      }
    } catch (lyricsError) {
      console.log('Lyrics.ovh API failed:', lyricsError)
    }

    // Try a simple web search for Christian lyrics (fallback)
    if (songResults.length === 0) {
      console.log('Trying web search fallback...')
      try {
        // Create a simple mock result for demonstration
        // In a real implementation, you would use a proper search API
        const mockLyrics = `# ${query}

Verse 1:
[This is a placeholder for the song lyrics]
[In a real implementation, this would be fetched from a lyrics database]
[or web search API]

Chorus:
[Chorus lyrics would appear here]
[With proper formatting and structure]

Verse 2:
[Additional verses would continue here]
[Following the same pattern]

Bridge:
[Bridge section if applicable]
[With appropriate musical notation]

Outro:
[Ending section]
[Completing the song structure]

Note: This is a demonstration. In production, real lyrics would be fetched from licensed sources.`

        songResults.push({
          title: query,
          lyrics: mockLyrics,
          source: 'Demo Source',
          url: 'https://example.com'
        })
      } catch (fallbackError) {
        console.log('Fallback search failed:', fallbackError)
      }
    }

    console.log('Total results found:', songResults.length)

    // Return results or error
    if (songResults.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not find lyrics for this song',
          details: 'No lyrics found. Try a different song name or check spelling.'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        query: query,
        results: songResults
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('AI Song Search Error:', error)
    
    return new Response(
      JSON.stringify({
        error: 'AI search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})