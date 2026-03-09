export async function generateLessonSummary(notes, topic, supabaseUrl, anonKey) {
  const apiUrl = `${supabaseUrl}/functions/v1/generate-notes`;

  const headers = {
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        brainDump: notes,
        moduleName: topic || 'Lesson',
        customInstructions: `Create a concise summary (2-3 sentences max) of the key learning points from these notes.
Then extract 3-5 key concepts as a bulleted list. Format your response as:
SUMMARY: [your summary here]
KEY_CONCEPTS:
- [concept 1]
- [concept 2]
- [concept 3]`
      })
    });

    const data = await response.json();

    if (!data.notes) {
      throw new Error('No summary generated');
    }

    const lines = data.notes.split('\n');
    let summary = '';
    const keyConcepts = [];
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

    if (!summary && data.notes.length < 300) {
      summary = data.notes.substring(0, 200);
    }

    return {
      summary: summary || 'Summary generated from lesson notes',
      keyConcepts: keyConcepts.length > 0 ? keyConcepts : []
    };
  } catch (error) {
    console.error('Failed to generate summary:', error);
    return {
      summary: '',
      keyConcepts: []
    };
  }
}
