import { createClient } from '@/utils/supabase/server';

export interface ProgressStats {
  streak: number;
  bestStreak: number;
  accuracy: number;
  totalQuestions: number;
  testsCompleted: number;
  evaluationsCompleted: number;
  weakTopics: { topic: string; score: number }[];
  mistakesNeedsReview: number;
  mistakesFixed: number;
}

export async function getProgressStats(userId: string): Promise<ProgressStats> {
  const supabase = await createClient();

  // 1. Calculate Streak
  // We fetch distinct dates from student_activity
  const { data: activityData } = await supabase
    .from('student_activity')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  let streak = 0;
  let bestStreak = 0;
  
  if (activityData && activityData.length > 0) {
    const dates = [...new Set(activityData.map(a => new Date(a.created_at).toISOString().split('T')[0]))];
    dates.sort((a, b) => b.localeCompare(a)); // Descending

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dates[0] === today || dates[0] === yesterday) {
      let currentStreak = 1;
      let currentDate = new Date(dates[0]);

      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i]);
        const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / 86400000);
        
        if (diffDays === 1) {
          currentStreak++;
          currentDate = prevDate;
        } else if (diffDays === 0) {
          continue; // should not happen with Set, but just in case
        } else {
          break; // Gap > 1 day
        }
      }
      streak = currentStreak;
    }
    
    // Calculate best streak historically
    let max = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;
    
    // dates are sorted descending, so iterate backwards to go chronologically
    for (let i = dates.length - 1; i >= 0; i--) {
      const d = new Date(dates[i]);
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((d.getTime() - lastDate.getTime()) / 86400000);
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      if (tempStreak > max) max = tempStreak;
      lastDate = d;
    }
    bestStreak = max;
  }

  // 2. Fetch Test Stats
  const { data: allAttempts } = await supabase
    .from('test_attempts')
    .select('total_questions, correct_answers')
    .eq('user_id', userId);

  let testsCompleted = 0;
  let totalQuestions = 0;
  let accuracy = 0;

  if (allAttempts && allAttempts.length > 0) {
    testsCompleted = allAttempts.length;
    totalQuestions = allAttempts.reduce((acc, curr) => acc + (curr.total_questions || 0), 0);
    const correctQ = allAttempts.reduce((acc, curr) => acc + (curr.correct_answers || 0), 0);
    accuracy = totalQuestions > 0 ? Math.round((correctQ / totalQuestions) * 100) : 0;
  }

  // 3. Evaluations Count
  const { count: evalCount } = await supabase
    .from('answer_evaluations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // 4. Weak Topics & Mistakes
  const { data: mistakesData } = await supabase
    .from('mistake_book')
    .select('status, topic, occurrence_count')
    .eq('user_id', userId);

  let mistakesNeedsReview = 0;
  let mistakesFixed = 0;
  const weakTopics: { topic: string; score: number }[] = [];

  if (mistakesData) {
    mistakesNeedsReview = mistakesData.filter(m => m.status === 'new' || m.status === 'reviewed' || m.status === 'practicing').length;
    mistakesFixed = mistakesData.filter(m => m.status === 'fixed').length;

    // Calculate topic frequencies
    const topicCounts = mistakesData.reduce((acc: any, m: any) => {
      acc[m.topic] = (acc[m.topic] || 0) + m.occurrence_count;
      return acc;
    }, {});
    
    Object.entries(topicCounts).forEach(([topic, count]) => {
       weakTopics.push({ topic, score: count as number });
    });
    
    // Sort descending by occurrence
    weakTopics.sort((a, b) => b.score - a.score);
  }

  return {
    streak,
    bestStreak,
    accuracy,
    totalQuestions,
    testsCompleted,
    evaluationsCompleted: evalCount || 0,
    weakTopics: weakTopics.slice(0, 5), // Return top 5 weakest
    mistakesNeedsReview,
    mistakesFixed
  };
}
