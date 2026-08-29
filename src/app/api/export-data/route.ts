import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // We strictly use the authenticated user.id to guarantee we only fetch their own data.
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const { data: activity } = await supabase.from('student_activity').select('*').eq('user_id', user.id);
    const { data: attempts } = await supabase.from('test_attempts').select('*').eq('user_id', user.id);
    
    // The test_attempt_questions use a different RLS policy, but we can query them normally
    // as RLS will enforce that the attempt belongs to the user.
    const { data: attemptQuestions } = await supabase.from('test_attempt_questions').select('*');
    
    const { data: evaluations } = await supabase.from('answer_evaluations').select('*').eq('user_id', user.id);
    const { data: mistakes } = await supabase.from('mistake_book').select('*').eq('user_id', user.id);

    const exportData = {
      export_date: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile || {},
      activity: activity || [],
      test_attempts: attempts || [],
      test_attempt_questions: attemptQuestions || [],
      evaluations: evaluations || [],
      mistake_book: mistakes || []
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="rankup_data_export.json"'
      }
    });

  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'We could not export your data at this time. Please try again later.' }, { status: 500 });
  }
}
