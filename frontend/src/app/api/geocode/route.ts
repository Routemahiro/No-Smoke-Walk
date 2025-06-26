import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json(
      { error: '緯度と経度が必要です' },
      { status: 400 }
    );
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ja,en&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'No-Smoke-Walk-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('住所の取得に失敗しました');
    }

    const data = await response.json();

    if (data && data.address) {
      // Format Japanese address
      const addr = data.address;
      const parts = [];
      
      if (addr.prefecture || addr.state) parts.push(addr.prefecture || addr.state);
      if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
      if (addr.suburb || addr.district) parts.push(addr.suburb || addr.district);
      if (addr.road) parts.push(addr.road);
      if (addr.house_number) parts.push(addr.house_number);
      
      const formattedAddress = parts.length > 0 ? parts.join(' ') : data.display_name;
      
      return NextResponse.json({
        success: true,
        address: formattedAddress,
        raw: data
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '住所を取得できませんでした'
      });
    }
  } catch (error) {
    console.error('Geocoding API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '住所の取得に失敗しました'
      },
      { status: 500 }
    );
  }
}