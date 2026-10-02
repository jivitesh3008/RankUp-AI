import { cache } from 'react';
import { createClient } from '@/utils/supabase/server';

export interface RecentActivityItem {
  type: 'upload' | 'doubt' | 'test' | 'evaluation';
  title: string;
  date: string;
  score: string | null;
}

export const getRecentActivity = cache(async (userId: string): Promise<RecentActivityItem[]> => {
  const supabase = await createClient();

  const [
    { data: activity },
    { data: attempts },
    { data: evaluations }
  ] = await Promise.all([
    supabase
      .from('student_activity')
      .select('event_type, chapter, topic, created_at, metadata_json')
      .eq('user_id', userId)
      .in('event_type', ['tutor_question', 'image_question', 'quick_revision'])
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('test_attempts')
      .select('id, title, total_questions, correct_answers, subject, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(3),
    supabase
      .from('answer_evaluations')
      .select('id, estimated_marks, total_marks, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
  ]);

  const mergedHistory: RecentActivityItem[] = [];
  if (activity) {
    activity.forEach(a => {
      let title = 'Asked a doubt';
      if (a.event_type === 'image_question') title = 'Uploaded Question';
      if (a.event_type === 'quick_revision') title = 'Quick Revision';
      
      mergedHistory.push({
        type: a.event_type === 'image_question' ? 'upload' : 'doubt',
        title,
        date: a.created_at,
        score: null,
      });
    });
  }
  if (attempts) {
    attempts.forEach(a => mergedHistory.push({
      type: 'test',
      title: a.title || 'Test',
      date: a.completed_at,
      score: `${a.correct_answers}/${a.total_questions}`,
    }));
  }
  if (evaluations) {
    evaluations.forEach(e => mergedHistory.push({
      type: 'evaluation',
      title: 'Answer evaluation',
      date: e.created_at,
      score: `${e.estimated_marks}/${e.total_marks}`,
    }));
  }
  
  mergedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return mergedHistory.slice(0, 3);
});
