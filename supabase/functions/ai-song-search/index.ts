import { corsHeaders } from '../_shared/cors.ts'

// Try/catch for Deno.env.get (in case not available, e.g., Deno Deploy)
let FIRECRAWL_API_KEY: string | undefined = undefined
try {
  FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY")
} catch (_) {
  // Not available in all environments
}

interface WebLink {
  name: string
  url: string
  snippet: string
}

function formatMarkdownResult(query: string, links: WebLink[]): string {
  if (links.length === 0) {
    return `# ${query}\n\n**Sorry, no lyrics found.**\n\nTry another song or double-check the title and artist.`
  }
  let md = `# Lyrics search: ${query}\n\n`
  for (const link of links) {
    md += `### [${link.name}](${link.url})\n\n`
    md += `${link.snippet}\n\n`
  }
  return md.trim()
}

async function searchLyricsLinks(query: string): Promise<WebLink[]> {
  if (!FIRECRAWL_API_KEY) {
    console.error("FIRECRAWL_API_KEY missing or not set in environment.")
    return []
  }

  const searchUrl = "https://api.firecrawl.dev/v1/search"
  const payload = {
    q: query + " christian lyrics",
    numResults: 5
  }

  let resp: Response
  try {
    resp = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": FIRECRAWL_API_KEY
      },
      body: JSON.stringify(payload)
    })
  } catch (err) {
    console.error("Firecrawl API request failed:", err)
    return []
  }

  if (!resp.ok) {
    let errorMsg = "Firecrawl API error: " + resp.status
    try {
      const errorData = await resp.json()
      errorMsg += " " + (errorData.error || JSON.stringify(errorData))
    } catch {}
    console.error(errorMsg)
    return []
  }

  let data: any
  try {
    data = await resp.json()
  } catch (err) {
    console.error("Failed to parse Firecrawl response:", err)
    return []
  }

  if (!data.results || !Array.isArray(data.results) || data.results.length === 0) return []

  // Get top 3 results with title, url, and snippet/description/content
  return data.results.slice(0, 3).map((item: any) => ({
    name: item.title || item.url || "Link",
    url: item.url,
    snippet: item.snippet || item.description || (item.content ? (item.content.length > 200 ? item.content.slice(0, 200) + "..." : item.content) : "")
  }))
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
      '# Error\n\nMethod not allowed',
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'text/markdown' },
      }
    )
  }

  try {
    const { query } = await req.json()

    if (!query || typeof query !== 'string') {
      return new Response(
        '# Error\n\nQuery parameter is required.',
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/markdown' },
        }
      )
    }

    let links: WebLink[] = []
    if (FIRECRAWL_API_KEY) {
      links = await searchLyricsLinks(query)
    } else {
      console.error("FIRECRAWL_API_KEY missing. Unable to perform search.")
    }

    // Markdown result with clickable links and lyric snippets
    const markdown = formatMarkdownResult(query, links)

    return new Response(
      markdown,
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/markdown' },
      }
    )
  } catch (error) {
    console.error('AI Song Search Error:', error)
    return new Response(
      '# Error\n\nAI search failed. Please try again later.',
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/markdown' },
      }
    )
  }
})