import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const chapter = searchParams.get('chapter');

    let query = supabase.from('chapter_notes').select('*');

    if (subject) query = query.eq('subject', subject);
    if (chapter) query = query.eq('chapter', chapter);

    // Get the latest version for each subject/chapter
    query = query.order('version', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase chapter_notes fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    // Since we ordered by version descending, the first one encountered for a chapter is the latest.
    // If we fetched without specific chapter, we might have multiple versions. Let's deduplicate.
    const latestNotesMap = new Map();
    data.forEach(note => {
      const key = `${note.subject}-${note.chapter}`;
      if (!latestNotesMap.has(key)) {
        latestNotesMap.set(key, note);
      }
    });

    const latestNotes = Array.from(latestNotesMap.values());

    return NextResponse.json({ notes: latestNotes });

  } catch (error) {
    console.error('chapter_notes API error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}
