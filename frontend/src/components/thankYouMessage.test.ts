import { describe, expect, it } from '@jest/globals';
import { thankYouMessage } from './ReportForm';

describe('thankYouMessage', () => {
  it('includes today\'s count, and a separate line when this report is the only one', () => {
    expect(thankYouMessage(1)).toBe(
      '報告を送信しました。ご協力ありがとうございます。きょう届いた報告として、回数に含めています。',
    );
    expect(thankYouMessage(4)).toBe(
      '報告を送信しました。ご協力ありがとうございます。きょうは、みなさまから4件の報告が届いています。',
    );
    expect(thankYouMessage(1)).not.toContain('最初');
    expect(thankYouMessage(1)).not.toContain('first');
  });

  it('keeps the one-line thank-you when the count is missing', () => {
    const fallback = '報告を送信しました。ご協力ありがとうございます。';
    expect(thankYouMessage(null)).toBe(fallback);
    expect(thankYouMessage(undefined)).toBe(fallback);
    expect(thankYouMessage(0)).toBe(fallback);
  });
});
