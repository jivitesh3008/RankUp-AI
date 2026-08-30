const { createClient } = require('@supabase/supabase-js');
// Use standard fetch if in newer Node

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !supabaseAdminKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey, { auth: { persistSession: false }});
const supabaseA = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false }});
const supabaseB = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false }});

async function runTests() {
  let userAId, userBId;
  let tokenA, tokenB;

  try {
    console.log('--- SETUP ---');
    
    // Create User A
    const emailA = `test-a-${Date.now()}@rankup.ai`;
    const resA = await supabaseAdmin.auth.admin.createUser({
      email: emailA,
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: 'Test User A' }
    });
    if (resA.error) throw resA.error;
    userAId = resA.data.user.id;
    
    // Sign in to get session A
    const loginA = await supabaseA.auth.signInWithPassword({ email: emailA, password: 'password123' });
    tokenA = loginA.data.session.access_token;
    console.log(`Created User A: ${userAId}`);

    // Create User B
    const emailB = `test-b-${Date.now()}@rankup.ai`;
    const resB = await supabaseAdmin.auth.admin.createUser({
      email: emailB,
      password: 'password123',
      email_confirm: true,
      user_metadata: { full_name: 'Test User B' }
    });
    if (resB.error) throw resB.error;
    userBId = resB.data.user.id;
    
    // Sign in to get session B
    const loginB = await supabaseB.auth.signInWithPassword({ email: emailB, password: 'password123' });
    tokenB = loginB.data.session.access_token;
    console.log(`Created User B: ${userBId}`);

    // Seed Data for User B using Admin
    console.log('\nSeeding data for User B...');
    
    // Activity
    await supabaseAdmin.from('student_activity').insert({
      user_id: userBId,
      event_type: 'test_event',
      chapter: 'Test Chapter'
    });
    
    // Test Attempt
    const attemptRes = await supabaseAdmin.from('test_attempts').insert({
      user_id: userBId,
      test_type: 'custom',
      total_questions: 10,
      correct_answers: 8,
      score_percentage: 80
    }).select().single();
    
    // Mistake
    await supabaseAdmin.from('mistake_book').insert({
      user_id: userBId,
      question_text: 'Test mistake',
      student_answer: 'Wrong answer'
    });
    
    // Evaluation
    await supabaseAdmin.from('answer_evaluations').insert({
      user_id: userBId,
      question_text: 'Test evaluation',
      total_marks: 5
    });

    console.log('\n--- TASK 24: CROSS-USER TEST ---');
    
    // A -> A data (Allowed)
    console.log('Checking A -> A data (Should be allowed):');
    const myProfile = await supabaseA.from('profiles').select('*').eq('id', userAId);
    console.log(`  My Profile: ${myProfile.data?.length > 0 ? 'Allowed' : 'Denied (or empty)'}`);
    
    // A -> B data (Denied)
    console.log('Checking A -> B data (Should be denied):');
    const theirProfile = await supabaseA.from('profiles').select('*').eq('id', userBId);
    console.log(`  Their Profile: ${theirProfile.data?.length === 0 ? 'Denied' : 'Allowed (FAIL)'}`);
    
    const theirActivity = await supabaseA.from('student_activity').select('*').eq('user_id', userBId);
    console.log(`  Their Activity: ${theirActivity.data?.length === 0 ? 'Denied' : 'Allowed (FAIL)'}`);
    
    const theirTests = await supabaseA.from('test_attempts').select('*').eq('user_id', userBId);
    console.log(`  Their Tests: ${theirTests.data?.length === 0 ? 'Denied' : 'Allowed (FAIL)'}`);
    
    const theirMistakes = await supabaseA.from('mistake_book').select('*').eq('user_id', userBId);
    console.log(`  Their Mistakes: ${theirMistakes.data?.length === 0 ? 'Denied' : 'Allowed (FAIL)'}`);

    const theirEvals = await supabaseA.from('answer_evaluations').select('*').eq('user_id', userBId);
    console.log(`  Their Evaluations: ${theirEvals.data?.length === 0 ? 'Denied' : 'Allowed (FAIL)'}`);
    
    
    console.log('\n--- TASK 26: EXPORT TEST ---');
    console.log('Simulating Export API for User B:');
    const expProfile = await supabaseB.from('profiles').select('*').eq('id', userBId).single();
    const expActivity = await supabaseB.from('student_activity').select('*').eq('user_id', userBId);
    console.log(`  Exported Profile ID: ${expProfile.data?.id === userBId ? 'Match' : 'Mismatch'}`);
    console.log(`  Exported Activity Count: ${expActivity.data?.length}`);
    // Check that we can't export A's data
    const expAActivity = await supabaseB.from('student_activity').select('*').eq('user_id', userAId);
    console.log(`  Exported User A's Activity using B's token: ${expAActivity.data?.length === 0 ? 'Denied' : 'Allowed (FAIL)'}`);


    console.log('\n--- TASK 25: DELETE TEST ---');
    console.log('Deleting User B via Admin (simulating DELETE /api/delete-account)...');
    
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userBId);
    if (deleteError) {
      console.log('Delete Error:', deleteError);
    } else {
      console.log('User B deleted.');
    }
    
    // Verify records removed
    console.log('Verifying records are removed (should all be 0):');
    const chkProfile = await supabaseAdmin.from('profiles').select('*').eq('id', userBId);
    console.log(`  Profile remaining: ${chkProfile.data?.length}`);
    
    const chkActivity = await supabaseAdmin.from('student_activity').select('*').eq('user_id', userBId);
    console.log(`  Activity remaining: ${chkActivity.data?.length}`);
    
    const chkTests = await supabaseAdmin.from('test_attempts').select('*').eq('user_id', userBId);
    console.log(`  Tests remaining: ${chkTests.data?.length}`);
    
  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    // Cleanup
    if (userAId) {
      console.log(`Cleaning up User A: ${userAId}`);
      await supabaseAdmin.auth.admin.deleteUser(userAId);
    }
    if (userBId) {
      // Just in case it didn't delete
      await supabaseAdmin.auth.admin.deleteUser(userBId);
    }
  }
}

runTests();
