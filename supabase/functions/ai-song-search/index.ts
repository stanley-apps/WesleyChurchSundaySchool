import { corsHeaders } from '../_shared/cors.ts'

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY')

interface FirecrawlResponse {
  success: boolean
  data?: {
    content?: string
    markdown?: string
  }
  error?: string
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

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Firecrawl API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Search for song lyrics using Firecrawl
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
        limit: 3,
      }),
    })

    if (!searchResponse.ok) {
      throw new Error(`Firecrawl search failed: ${searchResponse.statusText}`)
    }

    const searchData = await searchResponse.json()

    if (!searchData.success || !searchData.data || searchData.data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No lyrics found for this song' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Extract lyrics from the first result
    let lyrics = searchData.data[0].content || searchData.data[0].markdown || ''
    
    // Clean up the lyrics
    lyrics = lyrics
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .slice(0, 7000) // Limit to 7000 characters

    if (!lyrics || lyrics.length < 50) {
      return new Response(
        JSON.stringify({ error: 'Could not extract meaningful lyrics from search results' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        title: query,
        lyrics: lyrics,
        source: 'AI Search via Firecrawl'
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