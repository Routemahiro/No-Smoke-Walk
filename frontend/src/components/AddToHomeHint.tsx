'use client';

import { useEffect, useState } from 'react';

const HINT_KEY = 'add-to-home-hint-shown';

// Shown once, right after a successful report, unless already running from the home screen.
export function AddToHomeHint() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (standalone || localStorage.getItem(HINT_KEY) === 'true') return;
      localStorage.setItem(HINT_KEY, 'true');
    } catch {
      return;
    }
    setIsIOS(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="relative rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
      <button
        type="button"
        aria-label="閉じる"
        onClick={() => setVisible(false)}
        className="absolute right-2 top-1 text-lg leading-none text-blue-700"
      >
        ×
      </button>
      <p className="font-medium">ホーム画面に追加すると、次から1タップで報告できます</p>
      <p className="mt-1 text-xs text-blue-800">
        {isIOS
          ? 'Safariの共有ボタン（□↑）から「ホーム画面に追加」を選んでください。'
          : 'ブラウザのメニュー（︙）から「ホーム画面に追加」または「アプリをインストール」を選んでください。'}
      </p>
    </div>
  );
}
