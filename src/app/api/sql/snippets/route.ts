import { NextRequest, NextResponse } from 'next/server';
import { validateMasterAdmin } from '@/lib/auth-helpers';
import { getSnippets, createSnippet, deleteSnippet, getSavedQueries, createSavedQuery } from '@/lib/firebase/snippets';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await validateMasterAdmin(request);
    if (!currentUser) {
      return NextResponse.json({ snippets: [], savedQueries: [] });
    }

    const type = request.nextUrl.searchParams.get('type') || 'snippets';

    if (type === 'snippets') {
      const snippets = await getSnippets(currentUser.uid);
      return NextResponse.json({ snippets });
    } else {
      const queries = await getSavedQueries(currentUser.uid);
      return NextResponse.json({ savedQueries: queries });
    }
  } catch (err) {
    return NextResponse.json({ snippets: [], savedQueries: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await validateMasterAdmin(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (type === 'snippet') {
      const id = await createSnippet(currentUser.uid, data);
      return NextResponse.json({ id, ...data });
    } else if (type === 'savedQuery') {
      const id = await createSavedQuery(currentUser.uid, data);
      return NextResponse.json({ id, ...data });
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await validateMasterAdmin(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await deleteSnippet(currentUser.uid, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}