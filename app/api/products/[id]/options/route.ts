import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const supabase = await createClient();

    // Récupérer les options liées à ce produit
    const { data: options, error } = await supabase
      .from('catalog_options')
      .select('*')
      .eq('product_id', productId)
      .eq('is_available', true)
      .order('option_group_name', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[API] Error fetching product options:', error);
      return NextResponse.json(
        { error: 'Failed to fetch options' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      options: options || [],
    });
  } catch (error) {
    console.error('[API] Exception fetching product options:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
