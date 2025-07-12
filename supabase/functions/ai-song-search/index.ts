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

// Parse queries like "How Great Thou Art - Alan Jackson" or "How Great Thou Art by Alan Jackson"
function parseQuery(query: string): { artist: string, title: string } | null {
  let match = query.match(/^(.*?)\s*(?:-|by)\s*(.*)$/i)
  if (match && match[1] && match[2]) {
    return { artist: match[2].trim(), title: match[1].trim() }
  }
  return null
}

// Clean up lyrics text and ensure it's suitable for markdown
function lyricsToMarkdown(title: string, lyrics: string): string {
  // Remove excessive empty lines, trim lines
  const cleaned = lyrics
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n');
  // Return as markdown with a heading
  return `# ${title}\n\n${cleaned}\n`
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
      '```markdown\n**Error:** Method not allowed\n```',
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
        '```markdown\n**Error:** Query parameter is required\n```',
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/markdown' },
        }
      )
    }

    console.log('Searching for Christian song:', query)

    let songResults: SongResult[] = []
    let markdownResult: string | null = null

    // Parse query for artist and title
    const artistTitle = parseQuery(query)
    if (artistTitle) {
      const { artist, title } = artistTitle
      // Try lyrics.ovh API (free lyrics API)
      console.log('Trying lyrics.ovh API...')
      try {
        const lyricsResponse = await fetch(
          `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
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

          if (lyricsData.lyrics && lyricsData.lyrics.length > 30) {
            songResults.push({
              title: `${title} - ${artist}`,
              lyrics: lyricsData.lyrics.trim(),
              source: 'lyrics.ovh',
              url: 'https://lyrics.ovh'
            })
            markdownResult = lyricsToMarkdown(`${title} - ${artist}`, lyricsData.lyrics.trim())
          }
        } else {
          console.log('Lyrics.ovh API error:', lyricsResponse.status)
        }
      } catch (lyricsError) {
        console.log('Lyrics.ovh API failed:', lyricsError)
      }
    }

    // Fallback to demo if nothing found
    if (!markdownResult) {
      // If the query isn't in "Title - Artist" or "Title by Artist" format, prompt the user
      if (!artistTitle) {
        markdownResult = `# Christian Song Lyrics Search

**Error:** Please provide the song in the format \`Song Title - Artist\` or \`Song Title by Artist\`.

_Example: Amazing Grace - Chris Tomlin_`
      } else {
        // Fallback demo output (markdown)
        markdownResult = `# ${query}

**Sorry, lyrics for this song could not be found.**

---

> _This may be because the song is not in our database, is not a Christian song, or the artist/title format was incorrect._

**Try another song or check your spelling.**

_Example: How Great Thou Art - Alan Jackson_

---`
      }
    }

    return new Response(
      markdownResult,
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/markdown' },
      }
    )

  } catch (error) {
    console.error('AI Song Search Error:', error)
    return new Response(
      '```markdown\n**Error:** AI search failed. Please try again later.\n```',
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/markdown' },
      }
    )
  }
})