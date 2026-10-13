// The single "location denied" message (top page and quick mode).
// Swap the steps here only. Sources (checked 2026-10-13):
//  iPhone: https://support.apple.com/ja-jp/guide/iphone/iphb01fc3c85/26/ios/26
//          https://support.apple.com/ja-jp/102515 (wording provided by のあ)
//  Android: https://support.google.com/chrome/answer/142065?hl=ja&co=GENIE.Platform%3DAndroid
export const LOCATION_DENIED_COPY = {
  title: '位置情報がオフのため報告できません。',
  iphone: [
    'iPhoneは「設定」→「プライバシーとセキュリティ」→「位置情報サービス」をオンにし、「SafariのWebサイト」を「次回または共有時に確認」にしてから、このページを開き直して「許可」を押してください。',
  ],
  android: 'Android：アドレスバー左のアイコン → 権限 → 位置情報 → 許可',
} as const;
