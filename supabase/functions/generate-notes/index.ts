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

    const systemPrompt = `You are a helpful study assistant. Your job is to take a student's messy brain dump from a lesson and turn it into clear, organized notes.

${syllabus ? `Course context: ${syllabus}` : ''}
${customInstructions ? `Custom instructions: ${customInstructions}` : ''}

Format the notes clearly with:
- Clear headings and sections
- Bullet points for key concepts
- Important definitions highlighted
- Examples when relevant
- Any formulas or equations clearly formatted

Keep the student's original content and ideas, just organize and clarify them. Be concise but comprehensive.`;

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
