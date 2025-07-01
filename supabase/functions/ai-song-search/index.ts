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

function extractLyricsFromText(text: string): string {
  console.log('Extracting lyrics from text of length:', text.length)
  
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
      if (buffer.length >= 4) {
        lyricsBlocks.push(buffer.join('\n'))
        console.log('Found lyrics block of length:', buffer.join('\n').length)
      }
      buffer = []
    } else {
      buffer.push(trimmed)
    }
  }

  if (buffer.length >= 4) {
    lyricsBlocks.push(buffer.join('\n'))
    console.log('Found final lyrics block of length:', buffer.join('\n').length)
  }

  // Sort by longest lyrics block and return the best one
  const bestBlock = lyricsBlocks.sort((a, b) => b.length - a.length)[0] || ''
  console.log('Best lyrics block length:', bestBlock.length)
  
  return bestBlock
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
    console.log('Received search query:', query)

    if (!query || typeof query !== 'string') {
      console.log('Invalid query parameter')
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!FIRECRAWL_API_KEY) {
      console.log('Firecrawl API key not found')
      return new Response(
        JSON.stringify({ 
          error: 'AI search not configured',
          details: 'Firecrawl API key is not set up'
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Firecrawl API key found, making search request...')

    // Search for Christian song lyrics using Firecrawl
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const searchQuery = `"${query}" Christian song lyrics full text`
    console.log('Search query being sent to Firecrawl:', searchQuery)

    const searchResponse = await fetch('https://api.firecrawl.dev/v0/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        pageOptions: {
          onlyMainContent: true,
          includeHtml: false,
        },
        limit: 5,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    console.log('Firecrawl response status:', searchResponse.status)

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.log('Firecrawl error response:', errorText)
      throw new Error(`Firecrawl API error: ${searchResponse.status} - ${errorText}`)
    }

    const searchData: FirecrawlResponse = await searchResponse.json()
    console.log('Firecrawl response data:', JSON.stringify(searchData, null, 2))

    if (!searchData.success) {
      console.log('Firecrawl returned success: false')
      return new Response(
        JSON.stringify({ 
          error: 'Search failed',
          details: searchData.error || 'Firecrawl search was not successful'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!searchData.data || searchData.data.length === 0) {
      console.log('No search results returned from Firecrawl')
      return new Response(
        JSON.stringify({ 
          error: 'No lyrics found',
          details: 'Could not find any song lyrics for this search term'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Processing', searchData.data.length, 'search results...')

    const songResults: SongResult[] = []

    // Process each search result
    for (let i = 0; i < searchData.data.length; i++) {
      const result = searchData.data[i]
      console.log(`Processing result ${i + 1}:`, {
        url: result.url,
        title: result.title,
        contentLength: result.content?.length || 0,
        markdownLength: result.markdown?.length || 0
      })

      // Skip results without a valid URL
      if (!result.url || typeof result.url !== 'string' || result.url.trim() === '') {
        console.log(`Skipping result ${i + 1}: invalid URL`)
        continue
      }

      let lyrics = result.content || result.markdown || ''
      console.log(`Result ${i + 1} raw text length:`, lyrics.length)
      
      // Use the extraction function to get clean lyrics
      const extractedLyrics = extractLyricsFromText(lyrics)
      console.log(`Result ${i + 1} extracted lyrics length:`, extractedLyrics.length)
      
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

        console.log(`Adding result ${i + 1} to final results:`, {
          title: songTitle,
          lyricsLength: extractedLyrics.length,
          source: new URL(result.url).hostname
        })

        songResults.push({
          title: songTitle,
          lyrics: extractedLyrics.slice(0, 5000), // Limit to 5000 characters
          source: new URL(result.url).hostname,
          url: result.url
        })
      } else {
        console.log(`Skipping result ${i + 1}: lyrics too short (${extractedLyrics.length} chars)`)
      }
    }

    console.log('Final song results count:', songResults.length)

    if (songResults.length === 0) {
      console.log('No meaningful lyrics found in any results')
      return new Response(
        JSON.stringify({ 
          error: 'No meaningful lyrics found',
          details: 'Found search results but could not extract readable lyrics content'
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Returning successful response with', songResults.length, 'results')

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
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})