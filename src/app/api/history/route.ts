import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Fetch from all sources in parallel
    const [
      { data: conversations, error: errConversations },
      { data: oldActivities, error: errActivities },
      { data: testsData, error: errTests },
      { data: evaluationsData, error: errEvaluations },
      { data: mistakesData, error: errMistakes }
    ] = await Promise.all([
      supabase
        .from('tutor_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit),
      supabase
        .from('student_activity')
        .select('*')
        .eq('user_id', user.id)
        .in('event_type', ['tutor_question', 'image_question'])
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('test_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(limit),
      supabase
        .from('answer_evaluations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('mistake_book')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
    ]);

    let historyItems: any[] = [];

    // Map tutor_conversations
    if (conversations) {
      conversations.forEach((conv: any) => {
        historyItems.push({
          id: conv.id,
          type: 'doubt',
          title: 'Tutor Doubt',
          description: conv.title,
          chapter: conv.chapter || '',
          subject: conv.subject || 'Science',
          date: conv.updated_at,
          url: `/tutor?conversation=${conv.id}`
        });
      });
    }

    // Map old student_activity (only those not linked to a conversation)
    if (oldActivities) {
      oldActivities.forEach((activity: any) => {
        if (activity.metadata_json?.conversation_id) return; // Skip if it's already in conversations
        const isUpload = activity.event_type === 'image_question';
        
        let query = activity.metadata_json?.query || 'Unknown question';

        let type = 'doubt';
        if (isUpload) type = 'upload';
        
        let title = 'Tutor Doubt';
        if (isUpload) title = 'Uploaded Question';

        historyItems.push({
          id: activity.id,
          type: type,
          title: title,
          description: query,
          chapter: activity.chapter,
          subject: 'Science',
          date: activity.created_at,
          url: '/tutor'
        });
      });
    }

    // Map test_attempts
    if (testsData) {
      testsData.forEach((test: any) => {
        historyItems.push({
          id: test.id,
          type: 'test',
          title: test.title || 'Practice Test',
          description: `${test.total_questions} questions`,
          subject: test.subject,
          score: `${test.correct_answers}/${test.total_questions}`,
          percentage: test.score_percentage,
          date: test.completed_at,
          url: `/custom-test/result/${test.id}`
        });
      });
    }

    // Map answer_evaluations
    if (evaluationsData) {
      evaluationsData.forEach((evaluation: any) => {
        historyItems.push({
          id: evaluation.id,
          type: 'evaluation',
          title: 'Answer Evaluation',
          description: evaluation.question_text || 'Subjective Answer',
          chapter: evaluation.chapter,
          subject: 'Science',
          score: `${evaluation.estimated_marks}/${evaluation.total_marks}`,
          date: evaluation.created_at,
          url: `/answer-evaluation/result/${evaluation.id}`
        });
      });
    }

    // Map mistake_book
    if (mistakesData) {
      mistakesData.forEach((mistake: any) => {
        historyItems.push({
          id: mistake.id,
          type: 'mistake',
          title: 'Mistake Book',
          description: mistake.question_text,
          chapter: mistake.chapter,
          subject: 'Science',
          date: mistake.created_at,
          url: '/mistake-book'
        });
      });
    }

    // Sort by date descending
    historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply global limit
    historyItems = historyItems.slice(0, limit);

    return NextResponse.json({ history: historyItems });

  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
