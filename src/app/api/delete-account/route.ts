import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate Limiting check for sensitive actions
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    try {
      const { data: isAllowed, error: rateLimitError } = await supabaseAdmin.rpc('check_rate_limit', {
        client_ip: ip,
        max_requests: 5,
        window_seconds: 300 // 5 requests per 5 minutes
      });
      
      if (isAllowed === false) {
        return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
      }
    } catch (e) {
      console.error('Rate limit error:', e);
    }

    // Use the admin API to securely delete the authenticated user.
    // Because the DB has 'ON DELETE CASCADE' on user foreign keys (profiles, activity, tests, etc.),
    // all their educational data will be permanently purged automatically.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Account deletion failed in Supabase:', deleteError);
      return NextResponse.json({ error: 'Failed to delete account. Please contact support.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Account Deletion Error:', error);
    return NextResponse.json({ error: 'We could not delete your account at this time. Please try again later.' }, { status: 500 });
  }
}
