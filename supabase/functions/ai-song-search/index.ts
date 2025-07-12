import { corsHeaders } from '../_shared/cors.ts'

// Set your Firecrawl API key as an environment variable FIRECRAWL_API_KEY
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

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

// Firecrawl documentation: https://docs.firecrawl.dev/reference/search
async function searchLyricsLinks(query: string): Promise<WebLink[]> {
  if (!FIRECRAWL_API_KEY) return []

  // Firecrawl search endpoint
  const searchUrl = "https://api.firecrawl.dev/v1/search";
  const payload = {
    q: query + " christian lyrics",
    numResults: 5
  };

  const resp = await fetch(searchUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": FIRECRAWL_API_KEY
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) return []

  const data = await resp.json();

  // Firecrawl returns an array in data.results
  if (!data.results || !Array.isArray(data.results) || data.results.length === 0) return []

  // Get top 3 results with title, url, and snippet/description/content
  return data.results.slice(0, 3).map((item: any) => ({
    name: item.title || item.url,
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