/**
 * Converts numbers to Indian English currency words (Crores, Lakhs, Thousands, Hundreds).
 * Example: 1250000 -> "Rupees Twelve Lakh Fifty Thousand Only"
 */

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertTwoDigits(n: number): string {
  if (n < 20) return ones[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return tens[t] + (o > 0 ? ' ' + ones[o] : '');
}

function convertThreeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  let str = '';
  if (h > 0) {
    str += ones[h] + ' Hundred';
    if (r > 0) str += ' and ';
  }
  if (r > 0) {
    str += convertTwoDigits(r);
  }
  return str.trim();
}

export function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Rupees Zero Only';

  const num = Math.abs(amount);
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let current = rupees;
  let words = '';

  const crore = Math.floor(current / 10000000);
  current %= 10000000;

  const lakh = Math.floor(current / 100000);
  current %= 100000;

  const thousand = Math.floor(current / 1000);
  current %= 1000;

  const remainder = current;

  if (crore > 0) {
    words += convertTwoDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertThreeDigits(remainder) + ' ';
  }

  words = words.trim();
  let result = `Rupees ${words}`;

  if (paise > 0) {
    result += ` and ${convertTwoDigits(paise)} Paise`;
  }

  result += ' Only';
  return result;
}
