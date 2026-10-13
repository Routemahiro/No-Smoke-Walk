# osaka_wards.json

大阪市24区の境界ポリゴン（区の判定用）。

- 出典：国土数値情報（行政区域データ）（国土交通省）
  https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html
  （N03-20250101_27, データ基準年月日 2025年1月1日）を加工して作成
- ライセンス：CC BY 4.0（https://creativecommons.org/licenses/by/4.0/deed.ja）
- 原典の作成方法表示：「数値地図（国土基本情報）」の行政区画データから整備（測量法に基づく国土地理院長承認（複製）R 6JHf 503）
- 加工内容：N03_004 = 大阪市 の地物のみ抽出、区（N03_005）ごとに外周・穴のリングをまとめ、
  Douglas-Peucker（許容約4m）で簡略化、座標を小数5桁に丸め。境界付近では数m程度の誤差がある。
