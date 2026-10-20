import { describe, test, expect } from 'vitest';
import {
  escapeCsvField,
  generateCsv,
  generateExportFileName,
  formatToIso8601,
  isIsoDateString,
} from '../lib/csvExport';
import { ExportColumn } from '../lib/types';

describe('CSV Escaping and Export Specifications (RFC 4180 & ISO 8601)', () => {
  describe('escapeCsvField', () => {
    test('returns empty string for null and undefined', () => {
      expect(escapeCsvField(null)).toBe('');
      expect(escapeCsvField(undefined)).toBe('');
    });

    test('preserves plain alphanumeric strings without special characters', () => {
      expect(escapeCsvField('FacilPay')).toBe('FacilPay');
      expect(escapeCsvField('pay_123456')).toBe('pay_123456');
      expect(escapeCsvField('1250.50')).toBe('1250.50');
    });

    test('properly wraps fields containing commas in double quotes', () => {
      const input = 'Paris, France';
      const output = escapeCsvField(input);
      expect(output).toBe('"Paris, France"');
    });

    test('properly escapes fields containing double quotes by doubling them and enclosing in quotes', () => {
      const input = 'Standard "Enterprise" Plan';
      const output = escapeCsvField(input);
      expect(output).toBe('"Standard ""Enterprise"" Plan"');
    });

    test('properly wraps fields containing newlines (LF and CRLF) in double quotes', () => {
      const inputWithLf = 'First line\nSecond line';
      expect(escapeCsvField(inputWithLf)).toBe('"First line\nSecond line"');

      const inputWithCrlf = 'First line\r\nSecond line';
      expect(escapeCsvField(inputWithCrlf)).toBe('"First line\r\nSecond line"');
    });

    test('properly escapes fields containing commas, quotes, and newlines combined', () => {
      const complexInput = 'Item 1: "Widget", Item 2: "Gadget"\nDelivery: Urgent';
      const expected = '"Item 1: ""Widget"", Item 2: ""Gadget""\nDelivery: Urgent"';
      expect(escapeCsvField(complexInput)).toBe(expected);
    });

    test('formats Date objects as standard ISO 8601 strings', () => {
      const date = new Date('2026-01-15T14:32:00.000Z');
      expect(escapeCsvField(date)).toBe('2026-01-15T14:32:00.000Z');
    });

    test('preserves valid ISO 8601 string dates without alteration', () => {
      const isoStr = '2026-01-15T14:32:00.000Z';
      expect(escapeCsvField(isoStr)).toBe(isoStr);
    });
  });

  describe('isIsoDateString & formatToIso8601', () => {
    test('correctly identifies valid ISO 8601 date strings', () => {
      expect(isIsoDateString('2026-01-15T14:32:00.000Z')).toBe(true);
      expect(isIsoDateString('2026-01-15')).toBe(true);
      expect(isIsoDateString('2026-12-31T23:59:59Z')).toBe(true);
    });

    test('rejects non-ISO strings', () => {
      expect(isIsoDateString('January 15, 2026')).toBe(false);
      expect(isIsoDateString('15/01/2026')).toBe(false);
      expect(isIsoDateString('not-a-date')).toBe(false);
    });

    test('formatToIso8601 formats various date inputs properly', () => {
      const d = new Date('2026-01-15T14:32:00.000Z');
      expect(formatToIso8601(d)).toBe('2026-01-15T14:32:00.000Z');
      expect(formatToIso8601('2026-01-15T14:32:00.000Z')).toBe('2026-01-15T14:32:00.000Z');
      expect(formatToIso8601(null)).toBe('');
      expect(formatToIso8601(undefined)).toBe('');
    });
  });

  describe('generateCsv RFC 4180 Compliance', () => {
    interface TestRecord {
      id: string;
      name: string;
      amount: number;
      created: string;
    }

    const testColumns: ExportColumn<TestRecord>[] = [
      { key: 'id', label: 'ID', selected: true },
      { key: 'name', label: 'Client Name', selected: true },
      {
        key: 'amount',
        label: 'Amount ($)',
        selected: true,
        formatter: (val) => Number(val).toFixed(2),
      },
      { key: 'created', label: 'Creation Date', selected: true },
    ];

    const sampleData: TestRecord[] = [
      {
        id: 'rec_01',
        name: 'Acme, Corp',
        amount: 1500,
        created: '2026-01-10T12:00:00.000Z',
      },
      {
        id: 'rec_02',
        name: 'Mega "Tech" Ltd',
        amount: 2500.5,
        created: '2026-01-12T15:30:00.000Z',
      },
    ];

    test('generates valid RFC 4180 CSV with CRLF line breaks and properly escaped fields', () => {
      const csv = generateCsv(sampleData, testColumns);
      const lines = csv.split('\r\n');

      expect(lines.length).toBe(3); // Header + 2 data rows
      expect(lines[0]).toBe('ID,Client Name,Amount ($),Creation Date');
      expect(lines[1]).toBe('rec_01,"Acme, Corp",1500.00,2026-01-10T12:00:00.000Z');
      expect(lines[2]).toBe('rec_02,"Mega ""Tech"" Ltd",2500.50,2026-01-12T15:30:00.000Z');
    });

    test('omits unselected columns from CSV generation', () => {
      const partialColumns: ExportColumn<TestRecord>[] = [
        { key: 'id', label: 'ID', selected: true },
        { key: 'name', label: 'Client Name', selected: false }, // unselected
        { key: 'amount', label: 'Amount', selected: true },
      ];

      const csv = generateCsv(sampleData, partialColumns);
      const lines = csv.split('\r\n');

      expect(lines[0]).toBe('ID,Amount');
      expect(lines[1]).toBe('rec_01,1500');
    });
  });

  describe('generateExportFileName', () => {
    test('generates standardized file name format facilpay-<type>-<start>_<end>.csv', () => {
      const name = generateExportFileName(
        'payments',
        '2026-01-01',
        '2026-01-31'
      );
      expect(name).toBe('facilpay-payments-2026-01-01_2026-01-31.csv');
    });

    test('derives date boundaries from data items when filters are omitted', () => {
      const data = [
        { date: '2026-01-15T10:00:00.000Z' },
        { date: '2026-01-28T18:00:00.000Z' },
      ];
      const name = generateExportFileName('refunds', null, null, data);
      expect(name).toBe('facilpay-refunds-2026-01-15_2026-01-28.csv');
    });
  });
});
