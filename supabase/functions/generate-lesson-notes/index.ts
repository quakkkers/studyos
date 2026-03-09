import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

async function extractTextFromPDF(pdfUrl: string): Promise<string> {
  try {
    const response = await fetch(pdfUrl);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const decoder = new TextDecoder('utf-8', { fatal: false });
    let text = decoder.decode(uint8Array);

    text = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();

    return text || '[PDF content could not be extracted as text]';
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '[Error reading PDF file]';
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const {
      brainDump,
      attachmentUrls,
      moduleName,
      syllabus,
      learningStyle,
      regenerate,
      customPrompt
    } = await req.json();

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    let attachmentContents = '';

    if (attachmentUrls && attachmentUrls.length > 0) {
      const pdfUrls = attachmentUrls.filter((url: string) =>
        url.toLowerCase().endsWith('.pdf')
      );

      for (const pdfUrl of pdfUrls) {
        const pdfText = await extractTextFromPDF(pdfUrl);
        attachmentContents += `\n\n--- Attached PDF Content ---\n${pdfText}\n--- End of PDF ---\n`;
      }
    }

    const noteStyleInstructions = {
      'summary-first': 'Start with a clear summary at the top, then provide detailed notes below. Make summaries concise and highlight key concepts prominently.',
      'details-first': 'Provide comprehensive detailed notes first, then conclude with a summary section. Focus on depth and thorough explanations.',
      'balanced': 'Create balanced notes with inline summaries and key points integrated throughout the content. Mix summaries with details naturally.'
    };

    const styleInstruction = noteStyleInstructions[learningStyle?.noteStyle as keyof typeof noteStyleInstructions] || noteStyleInstructions.balanced;

    let systemPrompt = `You are an expert study assistant helping students create high-quality lecture notes. Your task is to process messy class notes and attached materials to create organized, comprehensive study notes.

${syllabus ? `Course Context: ${syllabus}` : ''}

Note Style Preference: ${styleInstruction}

Create notes that:
- Are well-structured with clear headings and hierarchy
- Use bullet points and numbered lists effectively
- Highlight key concepts, definitions, and formulas
- Include examples and practical applications when relevant
- Are comprehensive but easy to scan and review
- Follow the student's preferred learning style

If regenerating notes, consider the custom feedback provided and adjust accordingly.`;

    if (regenerate && customPrompt) {
      systemPrompt += `\n\nREGENERATION REQUEST: The student has asked you to regenerate the notes with this specific feedback: "${customPrompt}"`;
    }

    const userContent = regenerate
      ? `I need you to regenerate my notes with the following changes: ${customPrompt}\n\nOriginal brain dump:\n${brainDump}${attachmentContents}`
      : `Here are my notes from today's ${moduleName} lesson:\n\n${brainDump}${attachmentContents}\n\nPlease create well-organized, comprehensive study notes from this material.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: userContent
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

    const summaryResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `Based on these notes, create a concise 2-3 sentence summary and extract 3-5 key concepts.

Notes:
${notes}

Format your response EXACTLY as:
SUMMARY: [your 2-3 sentence summary]
KEY_CONCEPTS:
- [concept 1]
- [concept 2]
- [concept 3]`
          }
        ],
        system: "You are a summarization expert. Follow the format exactly.",
      }),
    });

    let summary = '';
    let keyConcepts: string[] = [];

    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      const summaryText = summaryData.content[0].text;
      const lines = summaryText.split('\n');
      let inKeyConcepts = false;

      for (const line of lines) {
        if (line.startsWith('SUMMARY:')) {
          summary = line.replace('SUMMARY:', '').trim();
        } else if (line.includes('KEY_CONCEPTS:')) {
          inKeyConcepts = true;
        } else if (inKeyConcepts && line.trim().startsWith('-')) {
          keyConcepts.push(line.trim().substring(1).trim());
        }
      }
    }

    return new Response(
      JSON.stringify({
        notes,
        summary,
        keyConcepts
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
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
