import { createSupabaseClient } from '../utils/supabase';
import { ApiResponse, Env } from '../types';

export async function handleExportCSV(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Parse query parameters
    const category = searchParams.get('category');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const prefecture = searchParams.get('prefecture');
    const city = searchParams.get('city');

    // Create Supabase client
    const supabase = createSupabaseClient(env);

    // Build query with filters
    let query = supabase
      .from('reports')
      .select('id, reported_at, lat, lon, prefecture, city, category, confidence_score')
      .order('reported_at', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (startDate) {
      query = query.gte('reported_at', startDate);
    }
    if (endDate) {
      query = query.lte('reported_at', endDate);
    }
    if (prefecture) {
      query = query.eq('prefecture', prefecture);
    }
    if (city) {
      query = query.eq('city', city);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch report data'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate CSV content
    const csvHeaders = [
      'ID',
      '報告日時',
      '緯度',
      '経度', 
      '都道府県',
      '市区町村',
      'カテゴリ',
      '信頼度スコア'
    ];

    const csvRows = reports?.map(report => [
      report.id,
      new Date(report.reported_at).toLocaleString('ja-JP'),
      report.lat.toString(),
      report.lon.toString(),
      report.prefecture,
      report.city,
      getCategoryLabel(report.category),
      report.confidence_score.toString()
    ]) || [];

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `no-smoke-walk-reports-${timestamp}.csv`;

    return new Response(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Disposition',
      }
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function handleExportExcel(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Parse query parameters (same as CSV)
    const category = searchParams.get('category');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const prefecture = searchParams.get('prefecture');
    const city = searchParams.get('city');

    // Create Supabase client
    const supabase = createSupabaseClient(env);

    // Build query with filters
    let query = supabase
      .from('reports')
      .select('id, reported_at, lat, lon, prefecture, city, category, confidence_score')
      .order('reported_at', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (startDate) {
      query = query.gte('reported_at', startDate);
    }
    if (endDate) {
      query = query.lte('reported_at', endDate);
    }
    if (prefecture) {
      query = query.eq('prefecture', prefecture);
    }
    if (city) {
      query = query.eq('city', city);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to fetch report data'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For Excel, we'll create a simple XML-based Excel format (SpreadsheetML)
    const excelHeaders = [
      'ID',
      '報告日時',
      '緯度',
      '経度', 
      '都道府県',
      '市区町村',
      'カテゴリ',
      '信頼度スコア'
    ];

    const excelRows = reports?.map(report => [
      report.id,
      new Date(report.reported_at).toLocaleString('ja-JP'),
      report.lat,
      report.lon,
      report.prefecture,
      report.city,
      getCategoryLabel(report.category),
      report.confidence_score
    ]) || [];

    // Create Excel XML content
    const excelContent = generateExcelXML(excelHeaders, excelRows);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `no-smoke-walk-reports-${timestamp}.xlsx`;

    return new Response(excelContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Disposition',
      }
    });

  } catch (error) {
    console.error('Excel export error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to get category label in Japanese
function getCategoryLabel(category: string): string {
  switch (category) {
    case 'walk_smoke': return '歩きタバコ';
    case 'stand_smoke': return '立ち止まり喫煙';
    case 'litter': return 'ポイ捨て';
    default: return category;
  }
}

// Helper function to generate Excel XML (simplified SpreadsheetML format)
function generateExcelXML(headers: string[], rows: any[][]): string {
  const headerCells = headers.map(header => 
    `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`
  ).join('');

  const dataRows = rows.map(row => {
    const cells = row.map((cell, index) => {
      const isNumber = index === 2 || index === 3 || index === 7; // lat, lon, confidence_score
      const dataType = isNumber ? 'Number' : 'String';
      const cellValue = isNumber ? cell : escapeXml(String(cell));
      return `<Cell><Data ss:Type="${dataType}">${cellValue}</Data></Cell>`;
    }).join('');
    return `<Row>${cells}</Row>`;
  }).join('');

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Reports">
  <Table>
   <Row>${headerCells}</Row>
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

// Helper function to escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}