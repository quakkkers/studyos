import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  notes: string;
  topic: string;
  customPrompt?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { notes, topic, customPrompt }: RequestBody = await req.json();

    if (!notes || notes.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Notes are required and must be at least 10 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const searchQuery = `${topic} key concepts study guide`;
    let webContext = '';

    try {
      const searchResponse = await fetch(
        `https://api.tavily.com/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: Deno.env.get("TAVILY_API_KEY"),
            query: searchQuery,
            search_depth: "basic",
            max_results: 3,
          }),
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.results && searchData.results.length > 0) {
          webContext = '\n\nAdditional context from web search:\n' +
            searchData.results.map((r: any) => `- ${r.content}`).join('\n');
        }
      }
    } catch (error) {
      console.log('Web search failed, continuing without it:', error);
    }

    const systemPrompt = `You are an expert study assistant specializing in creating comprehensive, well-organized study materials.

Your task is to analyze the student's lesson notes and create an enhanced summary that:

1. **SUMMARIZES** - Don't just repeat everything. Extract the core ideas and main themes
2. **GROUPS** - Identify related concepts and organize them under clear topic headings
3. **ENHANCES** - Add clarity, context, and connections between ideas
4. **STRUCTURES** - Use a clear hierarchy with headings, subheadings, and bullet points

${customPrompt ? `Custom instructions: ${customPrompt}\n` : ''}

Format your response as:

**SUMMARY**
[2-3 sentence overview of the main learning points]

**KEY CONCEPTS**
[Organized by theme/topic with clear headings]

**DETAILED BREAKDOWN**
[Group similar ideas together under logical section headings. Use bullet points for clarity. Add brief explanations where helpful.]

Focus on creating a study guide that's better organized and more useful than the original notes.`;

    const userPrompt = `Topic: ${topic}

Student's Notes:
${notes}
${webContext}

Please create an enhanced, well-organized summary of these notes.`;

    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `${systemPrompt}\n\n${userPrompt}`,
            },
          ],
        }),
      }
    );

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await anthropicResponse.json();
    const enhancedNotes = data.content[0].text;

    const lines = enhancedNotes.split('\n');
    let summary = '';
    const keyConcepts: string[] = [];
    let inKeyConcepts = false;
    let detailedContent = '';
    let inDetailed = false;

    for (const line of lines) {
      if (line.includes('**SUMMARY**') || line.includes('SUMMARY')) {
        continue;
      } else if (line.includes('**KEY CONCEPTS**') || line.includes('KEY CONCEPTS')) {
        inKeyConcepts = true;
        inDetailed = false;
        continue;
      } else if (line.includes('**DETAILED BREAKDOWN**') || line.includes('DETAILED BREAKDOWN')) {
        inKeyConcepts = false;
        inDetailed = true;
        continue;
      }

      if (!inKeyConcepts && !inDetailed && line.trim() && !line.startsWith('**')) {
        summary += line + ' ';
      } else if (inKeyConcepts && line.trim().startsWith('-')) {
        keyConcepts.push(line.trim().substring(1).trim());
      } else if (inDetailed) {
        detailedContent += line + '\n';
      }
    }

    if (!summary && !inKeyConcepts && !inDetailed) {
      const firstParagraph = enhancedNotes.split('\n\n')[0];
      summary = firstParagraph.length > 300 ? firstParagraph.substring(0, 297) + '...' : firstParagraph;
    }

    return new Response(
      JSON.stringify({
        summary: summary.trim() || 'Enhanced summary generated',
        keyConcepts: keyConcepts.length > 0 ? keyConcepts : [],
        enhancedNotes: detailedContent.trim() || enhancedNotes,
        fullResponse: enhancedNotes
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to enhance notes" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
