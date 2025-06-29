import { corsHeaders } from '../_shared/cors.ts'

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')

interface FirecrawlSearchResult {
  url: string
  title: string
  content?: string
  markdown?: string
}

interface FirecrawlResponse {
  success: boolean
  data?: FirecrawlSearchResult[]
  error?: string
}

interface SongResult {
  title: string
  lyrics: string
  source: string
  url: string
}

interface LyricsOvhResponse {
  lyrics?: string
}

function extractLyricsFromText(text: string): string {
  const lines = text.split('\n')
  const lyricsBlocks: string[] = []
  let buffer: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (
      trimmed === '' ||
      trimmed.length < 4 ||
      /^[\w\s]+:/.test(trimmed) // ignore metadata lines
    ) {
      if (buffer.length >= 4) lyricsBlocks.push(buffer.join('\n'))
      buffer = []
    } else {
      buffer.push(trimmed)
    }
  }

  if (buffer.length >= 4) lyricsBlocks.push(buffer.join('\n'))

  // Sort by longest lyrics block and return the best one
  return lyricsBlocks.sort((a, b) => b.length - a.length)[0] || ''
}

Deno.serve(async (req: Request) => {
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

    let songResults: SongResult[] = []

    // Step 1: Try Firecrawl AI Search (if API key is available)
    if (FIRECRAWL_API_KEY) {
      try {
        // Create AbortController for timeout handling
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

        const searchResponse = await fetch('https://api.firecrawl.dev/v0/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `"${query}" Christian song lyrics full text`,
            pageOptions: {
              onlyMainContent: true,
              includeHtml: false,
            },
            limit: 5,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (searchResponse.ok) {
          const searchData: FirecrawlResponse = await searchResponse.json()

          if (searchData.success && searchData.data && searchData.data.length > 0) {
            // Process each search result
            for (const result of searchData.data) {
              // Skip results without a valid URL
              if (!result.url || typeof result.url !== 'string' || result.url.trim() === '') {
                continue
              }

              let lyrics = result.content || result.markdown || ''
              
              // Use the extraction function to get clean lyrics
              const extractedLyrics = extractLyricsFromText(lyrics)
              
              // Only include results with meaningful lyrics content
              if (extractedLyrics && extractedLyrics.length > 100) {
                // Extract a better title from the page title or use the query
                let songTitle = result.title || query
                
                // Clean up the title (remove common website suffixes)
                songTitle = songTitle
                  .replace(/\s*-\s*(Lyrics|Song|Hymn|Christian|Gospel).*$/i, '')
                  .replace(/\s*\|\s*.*$/i, '')
                  .trim()

                if (!songTitle) {
                  songTitle = query
                }

                songResults.push({
                  title: songTitle,
                  lyrics: extractedLyrics.slice(0, 5000), // Limit to 5000 characters
                  source: new URL(result.url).hostname,
                  url: result.url
                })
              }
            }
          }
        }
      } catch (firecrawlError) {
        console.log('Firecrawl search failed, trying fallback:', firecrawlError)
        // Continue to fallback - don't return error yet
      }
    }

    // Step 2: Fallback to lyrics.ovh (free API) if no results from Firecrawl
    if (songResults.length === 0) {
      try {
        // lyrics.ovh expects artist/song format, but we'll try with just the query
        const fallbackResponse = await fetch(
          `https://api.lyrics.ovh/v1//${encodeURIComponent(query)}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        )

        if (fallbackResponse.ok) {
          const fallbackData: LyricsOvhResponse = await fallbackResponse.json()

          if (fallbackData.lyrics && fallbackData.lyrics.length > 50) {
            songResults.push({
              title: query,
              lyrics: fallbackData.lyrics.trim(),
              source: 'lyrics.ovh',
              url: 'https://lyrics.ovh'
            })
          }
        }
      } catch (fallbackError) {
        console.log('Fallback API also failed:', fallbackError)
        // Continue - we'll return an error below if no results
      }
    }

    // Return results or error
    if (songResults.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not find lyrics for this song',
          details: 'Both AI search and fallback API returned no results. Try a different song name or check spelling.'
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