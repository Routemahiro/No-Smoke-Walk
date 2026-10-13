// The single "location denied" message (top page and quick mode).
// Swap the steps here only. Sources (checked 2026-10-13):
//  iPhone: https://support.apple.com/ja-jp/guide/iphone/iphb01fc3c85/26/ios/26
//          https://support.apple.com/ja-jp/102515 (wording provided by のあ)
//  Android: https://support.google.com/chrome/answer/142065?hl=ja&co=GENIE.Platform%3DAndroid
export const LOCATION_DENIED_COPY = {
  title: '位置情報がオフのため報告できません。',
  iphone: [
    'iPhoneは「設定」→「プライバシーとセキュリティ」→「位置情報サービス」をオンにし、「SafariのWebサイト」（Chromeなら「Chrome」）を「このAppの使用中」か「確認」にしてください。',
    'それでも出ない場合は「設定」→「アプリ」→「Safari」→「位置情報」を「確認」にして、このページを開き直してください。',
  ],
  android: 'Android：アドレスバー左のアイコン → 権限 → 位置情報 → 許可',
} as const;
