import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { brainDump, moduleName, syllabus, customInstructions } = await req.json();

    if (!brainDump || brainDump.trim().length < 50) {
      return new Response(
        JSON.stringify({
          notes: "Keep writing... I'll help organize your thoughts once you've added more content (at least 50 characters)."
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const systemPrompt = `You are an expert study assistant who transforms messy lesson notes into clear, concise summaries.

${syllabus ? `Course context: ${syllabus}` : ''}
${customInstructions ? `Custom instructions: ${customInstructions}` : ''}

Your task:
1. SUMMARIZE the main ideas (don't just repeat everything)
2. GROUP similar concepts together under clear headings
3. Identify and highlight the KEY TAKEAWAYS
4. Use bullet points for clarity
5. Remove redundancy and organize logically

Think of it as: "What would a perfect study guide look like for these notes?" Not a transcript, but an actual summary that groups related ideas together.

Format with:
- Clear section headings for grouped topics
- Concise bullet points (not full paragraphs)
- Important terms in **bold**
- Examples only if they clarify a concept

Be significantly more concise than the original. Your goal is to make studying easier, not to preserve every word.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: `Here are my notes from today's ${moduleName} lesson:\n\n${brainDump}\n\nPlease organize these into clear, structured notes.`
          }
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    const notes = data.content[0].text;

    return new Response(
      JSON.stringify({ notes }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
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
