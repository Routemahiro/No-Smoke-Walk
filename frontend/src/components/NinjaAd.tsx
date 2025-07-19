'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

interface NinjaAdProps {
  adId: string;
  className?: string;
}

export function NinjaAd({ adId, className = '' }: NinjaAdProps) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  useEffect(() => {
    // ニンジャアドの初期化
    if (typeof window !== 'undefined') {
      // 広告の初期化処理
      const initNinjaAd = () => {
        if (window.ninja && window.ninja.queue) {
          window.ninja.queue.push(() => {
            try {
              window.ninja.display(adId);
              // 広告が表示されたことを確認
              setTimeout(() => {
                const adElement = document.getElementById(adId);
                if (adElement && adElement.innerHTML.trim() !== '') {
                  setAdLoaded(true);
                } else {
                  setAdFailed(true);
                }
              }, 1000);
            } catch (error) {
              setAdFailed(true);
            }
          });
        }
      };

      // スクリプト読み込み後に初期化
      if (window.ninja) {
        initNinjaAd();
      } else {
        // スクリプトが読み込まれるまで待機
        const checkNinja = setInterval(() => {
          if (window.ninja) {
            initNinjaAd();
            clearInterval(checkNinja);
          }
        }, 100);
        
        // 5秒後にタイムアウト
        setTimeout(() => {
          clearInterval(checkNinja);
          setAdFailed(true);
        }, 5000);
      }
    }
  }, [adId]);

  // 広告が失敗した場合は何も表示しない（コンテンツ間が詰められる）
  if (adFailed) {
    return null;
  }

  return (
    <>
      <Script
        id="ninja-ad-script"
        strategy="afterInteractive"
        src="https://www.ninja.co.jp/js/ninja_co_jp.js"
      />
      <div 
        id={adId}
        className={`ninja-ad ${className}`}
        style={{
          textAlign: 'center',
          margin: adLoaded ? '20px 0' : '0',
          minHeight: adLoaded ? 'auto' : '0',
          display: adLoaded ? 'block' : 'none',
        }}
      >
        {/* 広告コンテンツはNinja Adスクリプトによって動的に挿入される */}
      </div>
    </>
  );
}

// ニンジャアド用のタイプ定義
declare global {
  interface Window {
    ninja: {
      queue: Array<() => void>;
      display: (adId: string) => void;
    };
  }
}