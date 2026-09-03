import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('itemType');

    let query = supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (itemType) {
      query = query.eq('item_type', itemType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ bookmarks: data });
  } catch (error: any) {
    console.error('Bookmarks GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { item_type, item_id, title, preview, subject, chapter } = body;

    if (!item_type || !item_id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if it already exists
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', item_type)
      .eq('item_id', item_id)
      .single();

    if (existing) {
      return NextResponse.json({ bookmark: existing, message: 'Already bookmarked' });
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        item_type,
        item_id,
        title,
        preview: preview || '',
        subject: subject || 'General',
        chapter: chapter || 'General',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ bookmark: data });
  } catch (error: any) {
    console.error('Bookmarks POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const item_type = searchParams.get('item_type');
    const item_id = searchParams.get('item_id');

    let query = supabase.from('bookmarks').delete().eq('user_id', user.id);

    if (id) {
      query = query.eq('id', id);
    } else if (item_type && item_id) {
      query = query.eq('item_type', item_type).eq('item_id', item_id);
    } else {
      return NextResponse.json({ error: 'Must provide id or item_type + item_id' }, { status: 400 });
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Bookmarks DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
