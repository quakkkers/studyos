export async function generateLessonSummary(notes, topic, supabaseUrl, anonKey, customPrompt = '') {
  const apiUrl = `${supabaseUrl}/functions/v1/enhance-notes`;

  const headers = {
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        notes: notes,
        topic: topic || 'Lesson',
        customPrompt: customPrompt
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      summary: data.summary || 'Summary generated from lesson notes',
      keyConcepts: data.keyConcepts || [],
      enhancedNotes: data.enhancedNotes || '',
      fullResponse: data.fullResponse || ''
    };
  } catch (error) {
    console.error('Failed to generate summary:', error);
    return {
      summary: '',
      keyConcepts: [],
      enhancedNotes: '',
      fullResponse: ''
    };
  }
}
