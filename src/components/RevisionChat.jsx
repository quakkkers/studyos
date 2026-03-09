import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function RevisionChat({ userId, modules, onNavigateToLesson, onClose, notify }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestionPrompts = [
    "What should I revise today?",
    "Show me lessons I haven't reviewed recently",
    "Help me prepare for my upcoming exam",
    "What topics do I need to focus on?"
  ];

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*, modules!inner(*)')
        .eq('modules.user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      const context = `
Student Question: ${input}

Available Modules:
${modules.map(m => `- ${m.name} (${m.subject_type})`).join('\n')}

Recent Lessons:
${lessons.slice(0, 10).map(l => `- ${l.modules.name}: Lesson ${l.lesson_number} on ${l.date}${l.structured_notes ? ' (has notes)' : ' (no notes yet)'}`).join('\n')}

Based on the student's question, provide helpful guidance about what to revise, which lessons to review, or study advice. Be specific and actionable.
`;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-notes`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brainDump: context,
          moduleName: 'Revision Assistant',
          customInstructions: 'You are a helpful study assistant. Provide specific, actionable revision advice.'
        })
      });

      const data = await response.json();

      if (data.notes) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.notes }]);
      } else {
        throw new Error('No response generated');
      }
    } catch (error) {
      notify('Failed to get response', 'err');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        background: 'var(--white)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 700,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--paper2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{fontSize: 20, marginBottom: 4, color: 'var(--ink)'}}>📚 Revision Assistant</h2>
            <p style={{fontSize: 13, color: 'var(--ink3)'}}>Ask what to study or get revision guidance</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {messages.length === 0 && (
            <div style={{textAlign: 'center', padding: '40px 20px', color: 'var(--ink3)'}}>
              <div style={{fontSize: 48, marginBottom: 16}}>🎯</div>
              <h3 style={{fontSize: 18, marginBottom: 12, color: 'var(--ink)'}}>How can I help you study?</h3>
              <p style={{fontSize: 14, marginBottom: 20, lineHeight: 1.6}}>
                Ask me about what to revise, which topics to focus on, or get study recommendations
              </p>
              <div style={{display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, margin: '0 auto'}}>
                {suggestionPrompts.map(prompt => (
                  <button
                    key={prompt}
                    className="btn btn-ghost btn-sm"
                    onClick={() => setInput(prompt)}
                    style={{fontSize: 13, textAlign: 'left'}}
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: 12,
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--paper2)',
                color: msg.role === 'user' ? '#fff' : 'var(--ink)',
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div style={{alignSelf: 'flex-start', padding: '12px 16px'}}>
              <div style={{display: 'flex', gap: 6}}>
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
        </div>

        <div style={{
          padding: 16,
          borderTop: '1px solid var(--paper2)',
          display: 'flex',
          gap: 10
        }}>
          <input
            className="inp"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask about what to revise..."
            style={{flex: 1}}
          />
          <button
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
