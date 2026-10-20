import { NextRequest, NextResponse } from 'next/server';
import {
  generateCsv,
  generateExportFileName,
} from '@/lib/csvExport';
import {
  PAYMENT_EXPORT_COLUMNS,
  REFUND_EXPORT_COLUMNS,
  PAYOUT_EXPORT_COLUMNS,
  generateLargePayments,
  getPaymentFixtures,
  REFUND_FIXTURES,
  PAYOUT_FIXTURES,
} from '@/lib/mocks/fixtures';
import { ExportColumn } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type = 'payments',
      selectedColumnKeys,
      startDate,
      endDate,
      status,
      asset,
      useLargeDataset = false,
    } = body;

    let rawData: any[] = [];
    let defaultColumns: ExportColumn<any>[] = [];

    if (type === 'payments') {
      rawData = useLargeDataset ? generateLargePayments(2500) : getPaymentFixtures();
      defaultColumns = PAYMENT_EXPORT_COLUMNS;
    } else if (type === 'refunds') {
      rawData = REFUND_FIXTURES;
      defaultColumns = REFUND_EXPORT_COLUMNS;
    } else if (type === 'payouts') {
      rawData = PAYOUT_FIXTURES;
      defaultColumns = PAYOUT_EXPORT_COLUMNS;
    } else {
      return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    // Apply Filters
    const filtered = rawData.filter((item) => {
      if (status && status !== 'ALL' && item.status !== status) return false;
      if (asset && asset !== 'ALL' && item.asset !== asset) return false;
      if (startDate && item.date.slice(0, 10) < startDate) return false;
      if (endDate && item.date.slice(0, 10) > endDate) return false;
      return true;
    });

    // Map Selected Columns
    const activeColumns = defaultColumns.map((col) => ({
      ...col,
      selected: Array.isArray(selectedColumnKeys)
        ? selectedColumnKeys.includes(col.key)
        : true,
    }));

    const csvData = generateCsv(filtered, activeColumns);
    const fileName = generateExportFileName(type, startDate, endDate, filtered);

    // Return downloadable CSV with RFC 4180 / UTF-8 headers
    return new NextResponse('\uFEFF' + csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-Export-Rows-Count': String(filtered.length),
        'X-Export-Type': type,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Backend export failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get('type') || 'payments') as 'payments' | 'refunds' | 'payouts';

  return NextResponse.json({
    status: 'ready',
    service: 'FacilPay Backend Export Job Service',
    supportedTypes: ['payments', 'refunds', 'payouts'],
    rfcCompliance: 'RFC 4180',
    requestedType: type,
  });
}
