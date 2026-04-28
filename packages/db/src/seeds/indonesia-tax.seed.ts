/**
 * Indonesia tax seed data for 2024–2025.
 *
 * Sources:
 *   - PMK 168/2023: PPh 21 TER method and brackets (effective Jan 2024)
 *   - PP 44/2015: BPJS Ketenagakerjaan rates (JHT, JP, JKK, JKM)
 *   - Perpres 75/2019 + update: BPJS Kesehatan rates
 *   - UU HPP (Harmonisasi Peraturan Perpajakan) for PTKP amounts
 *
 * To run:
 *   pnpm --filter @hris/db seed
 */

export const EFFECTIVE_FROM = '2024-01-01';

// ─── PTKP Categories ─────────────────────────────────────────────────────────
// Annual PTKP amounts in IDR per PMK 101/PMK.010/2016 (unchanged since 2016)

export const ptkpCategorySeed = [
  { code: 'TK/0', description: 'Single, no dependents',             descriptionId: 'Tidak kawin, 0 tanggungan',    annualAmount: '54000000', terCategory: 'A' },
  { code: 'TK/1', description: 'Single, 1 dependent',               descriptionId: 'Tidak kawin, 1 tanggungan',    annualAmount: '58500000', terCategory: 'B' },
  { code: 'TK/2', description: 'Single, 2 dependents',              descriptionId: 'Tidak kawin, 2 tanggungan',    annualAmount: '63000000', terCategory: 'B' },
  { code: 'TK/3', description: 'Single, 3 dependents',              descriptionId: 'Tidak kawin, 3 tanggungan',    annualAmount: '67500000', terCategory: 'B' },
  { code: 'K/0',  description: 'Married, no dependents',            descriptionId: 'Kawin, 0 tanggungan',          annualAmount: '58500000', terCategory: 'B' },
  { code: 'K/1',  description: 'Married, 1 dependent',              descriptionId: 'Kawin, 1 tanggungan',          annualAmount: '63000000', terCategory: 'C' },
  { code: 'K/2',  description: 'Married, 2 dependents',             descriptionId: 'Kawin, 2 tanggungan',          annualAmount: '67500000', terCategory: 'C' },
  { code: 'K/3',  description: 'Married, 3 dependents',             descriptionId: 'Kawin, 3 tanggungan',          annualAmount: '72000000', terCategory: 'C' },
  { code: 'K/I/0', description: 'Married, combined income, 0 deps', descriptionId: 'Kawin, penghasilan digabung, 0 tanggungan', annualAmount: '112500000', terCategory: 'C' },
  { code: 'K/I/1', description: 'Married, combined income, 1 dep',  descriptionId: 'Kawin, penghasilan digabung, 1 tanggungan', annualAmount: '117000000', terCategory: 'C' },
  { code: 'K/I/2', description: 'Married, combined income, 2 deps', descriptionId: 'Kawin, penghasilan digabung, 2 tanggungan', annualAmount: '121500000', terCategory: 'C' },
  { code: 'K/I/3', description: 'Married, combined income, 3 deps', descriptionId: 'Kawin, penghasilan digabung, 3 tanggungan', annualAmount: '126000000', terCategory: 'C' },
] as const;

// ─── TER Brackets — Category A (TK/0) ────────────────────────────────────────
// Monthly gross income brackets per PMK 168/2023 Lampiran A

export const terBracketsSeedA = [
  { terCategory: 'A', incomeFrom:        '0', incomeTo:  '5400000', rate: '0.0000' },
  { terCategory: 'A', incomeFrom:  '5400001', incomeTo:  '5650000', rate: '0.0025' },
  { terCategory: 'A', incomeFrom:  '5650001', incomeTo:  '5950000', rate: '0.0050' },
  { terCategory: 'A', incomeFrom:  '5950001', incomeTo:  '6300000', rate: '0.0075' },
  { terCategory: 'A', incomeFrom:  '6300001', incomeTo:  '6750000', rate: '0.0100' },
  { terCategory: 'A', incomeFrom:  '6750001', incomeTo:  '7500000', rate: '0.0125' },
  { terCategory: 'A', incomeFrom:  '7500001', incomeTo:  '8550000', rate: '0.0150' },
  { terCategory: 'A', incomeFrom:  '8550001', incomeTo:  '9650000', rate: '0.0175' },
  { terCategory: 'A', incomeFrom:  '9650001', incomeTo: '10050000', rate: '0.0200' },
  { terCategory: 'A', incomeFrom: '10050001', incomeTo: '10350000', rate: '0.0225' },
  { terCategory: 'A', incomeFrom: '10350001', incomeTo: '10700000', rate: '0.0250' },
  { terCategory: 'A', incomeFrom: '10700001', incomeTo: '11050000', rate: '0.0300' },
  { terCategory: 'A', incomeFrom: '11050001', incomeTo: '11600000', rate: '0.0350' },
  { terCategory: 'A', incomeFrom: '11600001', incomeTo: '12500000', rate: '0.0400' },
  { terCategory: 'A', incomeFrom: '12500001', incomeTo: '13750000', rate: '0.0500' },
  { terCategory: 'A', incomeFrom: '13750001', incomeTo: '15100000', rate: '0.0600' },
  { terCategory: 'A', incomeFrom: '15100001', incomeTo: '16950000', rate: '0.0700' },
  { terCategory: 'A', incomeFrom: '16950001', incomeTo: '19750000', rate: '0.0800' },
  { terCategory: 'A', incomeFrom: '19750001', incomeTo: '24150000', rate: '0.0900' },
  { terCategory: 'A', incomeFrom: '24150001', incomeTo: '26450000', rate: '0.1000' },
  { terCategory: 'A', incomeFrom: '26450001', incomeTo: '28000000', rate: '0.1100' },
  { terCategory: 'A', incomeFrom: '28000001', incomeTo: '30050000', rate: '0.1200' },
  { terCategory: 'A', incomeFrom: '30050001', incomeTo: '32400000', rate: '0.1300' },
  { terCategory: 'A', incomeFrom: '32400001', incomeTo: '35400000', rate: '0.1400' },
  { terCategory: 'A', incomeFrom: '35400001', incomeTo: '39100000', rate: '0.1500' },
  { terCategory: 'A', incomeFrom: '39100001', incomeTo: '43850000', rate: '0.1600' },
  { terCategory: 'A', incomeFrom: '43850001', incomeTo: '47800000', rate: '0.1700' },
  { terCategory: 'A', incomeFrom: '47800001', incomeTo: '51400000', rate: '0.1800' },
  { terCategory: 'A', incomeFrom: '51400001', incomeTo: '56300000', rate: '0.1900' },
  { terCategory: 'A', incomeFrom: '56300001', incomeTo: '62200000', rate: '0.2000' },
  { terCategory: 'A', incomeFrom: '62200001', incomeTo: '66700000', rate: '0.2100' },
  { terCategory: 'A', incomeFrom: '66700001', incomeTo: '74500000', rate: '0.2200' },
  { terCategory: 'A', incomeFrom: '74500001', incomeTo: '86600000', rate: '0.2300' },
  { terCategory: 'A', incomeFrom: '86600001', incomeTo: '103600000', rate: '0.2400' },
  { terCategory: 'A', incomeFrom: '103600001', incomeTo: null, rate: '0.3000' },
] as const;

// ─── TER Brackets — Category B (TK/1, TK/2, TK/3, K/0) ─────────────────────

export const terBracketsSeedB = [
  { terCategory: 'B', incomeFrom:        '0', incomeTo:  '6200000', rate: '0.0000' },
  { terCategory: 'B', incomeFrom:  '6200001', incomeTo:  '6500000', rate: '0.0025' },
  { terCategory: 'B', incomeFrom:  '6500001', incomeTo:  '6850000', rate: '0.0050' },
  { terCategory: 'B', incomeFrom:  '6850001', incomeTo:  '7300000', rate: '0.0075' },
  { terCategory: 'B', incomeFrom:  '7300001', incomeTo:  '9200000', rate: '0.0100' },
  { terCategory: 'B', incomeFrom:  '9200001', incomeTo: '10750000', rate: '0.0150' },
  { terCategory: 'B', incomeFrom: '10750001', incomeTo: '11250000', rate: '0.0200' },
  { terCategory: 'B', incomeFrom: '11250001', incomeTo: '11600000', rate: '0.0250' },
  { terCategory: 'B', incomeFrom: '11600001', incomeTo: '12600000', rate: '0.0300' },
  { terCategory: 'B', incomeFrom: '12600001', incomeTo: '13600000', rate: '0.0400' },
  { terCategory: 'B', incomeFrom: '13600001', incomeTo: '14950000', rate: '0.0500' },
  { terCategory: 'B', incomeFrom: '14950001', incomeTo: '16400000', rate: '0.0600' },
  { terCategory: 'B', incomeFrom: '16400001', incomeTo: '18450000', rate: '0.0700' },
  { terCategory: 'B', incomeFrom: '18450001', incomeTo: '21850000', rate: '0.0800' },
  { terCategory: 'B', incomeFrom: '21850001', incomeTo: '26000000', rate: '0.0900' },
  { terCategory: 'B', incomeFrom: '26000001', incomeTo: '27700000', rate: '0.1000' },
  { terCategory: 'B', incomeFrom: '27700001', incomeTo: '29350000', rate: '0.1100' },
  { terCategory: 'B', incomeFrom: '29350001', incomeTo: '31450000', rate: '0.1200' },
  { terCategory: 'B', incomeFrom: '31450001', incomeTo: '33950000', rate: '0.1300' },
  { terCategory: 'B', incomeFrom: '33950001', incomeTo: '37100000', rate: '0.1400' },
  { terCategory: 'B', incomeFrom: '37100001', incomeTo: '41100000', rate: '0.1500' },
  { terCategory: 'B', incomeFrom: '41100001', incomeTo: '45800000', rate: '0.1600' },
  { terCategory: 'B', incomeFrom: '45800001', incomeTo: '49500000', rate: '0.1700' },
  { terCategory: 'B', incomeFrom: '49500001', incomeTo: '53800000', rate: '0.1800' },
  { terCategory: 'B', incomeFrom: '53800001', incomeTo: '58500000', rate: '0.1900' },
  { terCategory: 'B', incomeFrom: '58500001', incomeTo: '64000000', rate: '0.2000' },
  { terCategory: 'B', incomeFrom: '64000001', incomeTo: '71000000', rate: '0.2100' },
  { terCategory: 'B', incomeFrom: '71000001', incomeTo: '80000000', rate: '0.2200' },
  { terCategory: 'B', incomeFrom: '80000001', incomeTo: '93000000', rate: '0.2300' },
  { terCategory: 'B', incomeFrom: '93000001', incomeTo: '109000000', rate: '0.2400' },
  { terCategory: 'B', incomeFrom: '109000001', incomeTo: null, rate: '0.3000' },
] as const;

// ─── TER Brackets — Category C (K/1, K/2, K/3) ───────────────────────────────

export const terBracketsSeedC = [
  { terCategory: 'C', incomeFrom:        '0', incomeTo:  '6600000', rate: '0.0000' },
  { terCategory: 'C', incomeFrom:  '6600001', incomeTo:  '6950000', rate: '0.0025' },
  { terCategory: 'C', incomeFrom:  '6950001', incomeTo:  '7350000', rate: '0.0050' },
  { terCategory: 'C', incomeFrom:  '7350001', incomeTo:  '7800000', rate: '0.0075' },
  { terCategory: 'C', incomeFrom:  '7800001', incomeTo:  '8850000', rate: '0.0100' },
  { terCategory: 'C', incomeFrom:  '8850001', incomeTo: '10000000', rate: '0.0150' },
  { terCategory: 'C', incomeFrom: '10000001', incomeTo: '10950000', rate: '0.0200' },
  { terCategory: 'C', incomeFrom: '10950001', incomeTo: '11200000', rate: '0.0250' },
  { terCategory: 'C', incomeFrom: '11200001', incomeTo: '12050000', rate: '0.0300' },
  { terCategory: 'C', incomeFrom: '12050001', incomeTo: '12950000', rate: '0.0400' },
  { terCategory: 'C', incomeFrom: '12950001', incomeTo: '14150000', rate: '0.0500' },
  { terCategory: 'C', incomeFrom: '14150001', incomeTo: '15550000', rate: '0.0600' },
  { terCategory: 'C', incomeFrom: '15550001', incomeTo: '17050000', rate: '0.0700' },
  { terCategory: 'C', incomeFrom: '17050001', incomeTo: '19500000', rate: '0.0800' },
  { terCategory: 'C', incomeFrom: '19500001', incomeTo: '22700000', rate: '0.0900' },
  { terCategory: 'C', incomeFrom: '22700001', incomeTo: '24750000', rate: '0.1000' },
  { terCategory: 'C', incomeFrom: '24750001', incomeTo: '26500000', rate: '0.1100' },
  { terCategory: 'C', incomeFrom: '26500001', incomeTo: '28000000', rate: '0.1200' },
  { terCategory: 'C', incomeFrom: '28000001', incomeTo: '30050000', rate: '0.1300' },
  { terCategory: 'C', incomeFrom: '30050001', incomeTo: '32400000', rate: '0.1400' },
  { terCategory: 'C', incomeFrom: '32400001', incomeTo: '35400000', rate: '0.1500' },
  { terCategory: 'C', incomeFrom: '35400001', incomeTo: '39100000', rate: '0.1600' },
  { terCategory: 'C', incomeFrom: '39100001', incomeTo: '43850000', rate: '0.1700' },
  { terCategory: 'C', incomeFrom: '43850001', incomeTo: '47800000', rate: '0.1800' },
  { terCategory: 'C', incomeFrom: '47800001', incomeTo: '51400000', rate: '0.1900' },
  { terCategory: 'C', incomeFrom: '51400001', incomeTo: '56300000', rate: '0.2000' },
  { terCategory: 'C', incomeFrom: '56300001', incomeTo: '62200000', rate: '0.2100' },
  { terCategory: 'C', incomeFrom: '62200001', incomeTo: '66700000', rate: '0.2200' },
  { terCategory: 'C', incomeFrom: '66700001', incomeTo: '74500000', rate: '0.2300' },
  { terCategory: 'C', incomeFrom: '74500001', incomeTo: '86600000', rate: '0.2400' },
  { terCategory: 'C', incomeFrom: '86600001', incomeTo: null, rate: '0.3000' },
] as const;

// ─── BPJS Contribution Rates ──────────────────────────────────────────────────
// Rates as of 2025 per PP 44/2015 and Perpres 75/2019

export const contributionBandSeed = [
  // JHT (Jaminan Hari Tua / Old Age Savings)
  { component: 'jht_employee',    rate: '0.0200', salaryCap: null,         riskCategory: null },
  { component: 'jht_employer',    rate: '0.0370', salaryCap: null,         riskCategory: null },

  // JP (Jaminan Pensiun / Pension) — salary ceiling applies
  { component: 'jp_employee',     rate: '0.0100', salaryCap: '9077600',    riskCategory: null },
  { component: 'jp_employer',     rate: '0.0200', salaryCap: '9077600',    riskCategory: null },

  // JKK (Jaminan Kecelakaan Kerja / Work Accident) — risk-based, risk_category 1–5
  { component: 'jkk_employer',    rate: '0.0024', salaryCap: null,         riskCategory: 1 },
  { component: 'jkk_employer',    rate: '0.0054', salaryCap: null,         riskCategory: 2 },
  { component: 'jkk_employer',    rate: '0.0089', salaryCap: null,         riskCategory: 3 },
  { component: 'jkk_employer',    rate: '0.0127', salaryCap: null,         riskCategory: 4 },
  { component: 'jkk_employer',    rate: '0.0174', salaryCap: null,         riskCategory: 5 },

  // JKM (Jaminan Kematian / Death Benefit)
  { component: 'jkm_employer',    rate: '0.0030', salaryCap: null,         riskCategory: null },

  // BPJS Kesehatan — salary ceiling Rp 12,000,000/month
  { component: 'kesehatan_employee', rate: '0.0100', salaryCap: '12000000', riskCategory: null },
  { component: 'kesehatan_employer', rate: '0.0400', salaryCap: '12000000', riskCategory: null },
] as const;
