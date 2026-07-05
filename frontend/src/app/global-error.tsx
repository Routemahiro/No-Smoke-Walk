'use client';

export default function GlobalError() {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 px-4 py-10">
          <section className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-blue-700">No-Smoke Alert</p>
            <h1 className="mt-3 text-xl font-semibold text-gray-900">
              ページの読み込み中に問題が発生しました
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              一時的な読み込み失敗の可能性があります。ページを再読み込みしても改善しない場合は、少し時間をおいてから再度お試しください。
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              再読み込み
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
