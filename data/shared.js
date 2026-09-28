// シゴト負荷チェック: index.html（個人チェック）と aggregate.html（職場集計）の共通定義。
// 読み込み順は industries.js → shared.js → 各画面のスクリプト（COMMON_CATEGORY・DATA_VERSIONを参照するため）。

const HOURS_OPTIONS = [
  { value: '30分未満', hours: 0.25 },
  { value: '30分〜1時間', hours: 0.75 },
  { value: '1〜3時間', hours: 2 },
  { value: '3〜5時間', hours: 4 },
  { value: '5時間以上', hours: 6 },
];
const PAIN_OPTIONS = [
  { value: 'あまりつらくない', weight: 1 },
  { value: 'ややつらい', weight: 2 },
  { value: 'つらい', weight: 3 },
];
// 共通の理由リスト（v2-spec.md「共通の理由リスト」参照）。category を持たない理由は「その他」で、判定には使わない。
const REASONS = [
  { value: '同じ内容を何度も書く・入力する', category: '定型' },
  { value: '手順が面倒・道具やシステムが使いにくい', category: '定型' },
  { value: '人や日程の調整が大変・待たされる', category: '調整' },
  { value: '判断が難しい・迷う', category: '判断' },
  { value: '人への対応が精神的にしんどい', category: '対人' },
  { value: '体力的にきつい', category: '身体' },
  { value: '量が多い・時間が足りない', category: '業務量' },
  { value: '時間内に終わらず、時間外にやっている', category: '業務量' },
];
const CATEGORY_MESSAGE = {
  '定型': '繰り返し・手作業や、同じ内容を何度も書く業務に負荷が集中しています。自動化やテンプレ化、記録の一元化で減らせる可能性が高い領域です。',
  '調整': '人や日程の調整に負荷が集中しています。連絡や予定の一元管理で減らせる可能性があります。',
  '判断': '専門的な判断が必要な業務に負荷が集中しています。判断材料をそろえる仕組みで負担を軽くできる可能性があります。',
  '対人': '人との関わりそのものに負荷が集中しています。ツールで解決する領域ではないため、職場の上司や専門家への相談をおすすめします。',
  '身体': '体力的な負荷が集中しています。福祉機器の導入や人員配置の見直しが有効な領域です。',
  '業務量': '個別の業務の性質よりも、業務の絶対量や時間内に終わらないことそのものが負荷になっています。人員配置や業務量そのものの見直しが必要かもしれません。',
};
const CATEGORY_COLOR = {
  '定型': '#52b788',
  '調整': '#4a90a4',
  '判断': '#7c6bb0',
  '対人': '#e07a5f',
  '身体': '#d4a24c',
  '業務量': '#bf6900',
};
const REASON_OVERTIME = '時間内に終わらず、時間外にやっている';
const REASON_DUPLICATE = '同じ内容を何度も書く・入力する';
const RESULT_CODE_PREFIX = 'SK1-';
const MIN_AGGREGATE_RESPONSES = 5;

// 業種の全役割・全カテゴリ＋共通業務をフラットに並べた配列を返す。
// 役割による表示のON/OFFに関わらず固定の並びなので、結果コードの taskIndex はこの配列基準になる。
function getFlatTasks(industry) {
  const flat = [];
  const categories = [...industry.categories, COMMON_CATEGORY];
  categories.forEach(cat => {
    cat.tasks.forEach(t => flat.push(t));
  });
  return flat;
}

// UTF-8文字列 <-> base64url 変換（結果コードのエンコード用）
function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64UrlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// 診断結果(results配列)から結果コード文字列を作る。
// results の各要素は { flatIndex, timeValue, painChecked, reasons } を持つことを期待する。
function buildResultCode(industryId, results, overWorkload) {
  const taskEntries = results.map(r => {
    const timeIndex = HOURS_OPTIONS.findIndex(h => h.value === r.timeValue);
    const painIndex = PAIN_OPTIONS.findIndex(p => p.value === r.painChecked);
    let reasonBits = 0;
    (r.reasons || []).forEach(value => {
      const idx = REASONS.findIndex(x => x.value === value);
      if (idx >= 0) reasonBits |= (1 << idx);
    });
    return [r.flatIndex, timeIndex, painIndex, reasonBits];
  });
  const payload = {
    v: 1,
    d: DATA_VERSION,
    i: industryId,
    o: overWorkload ? 1 : 0,
    t: taskEntries,
  };
  return RESULT_CODE_PREFIX + base64UrlEncode(JSON.stringify(payload));
}

// 結果コード文字列をパースする。読めない/形式が違う場合は null を返す。
function parseResultCode(code) {
  const trimmed = code.trim();
  if (!trimmed.startsWith(RESULT_CODE_PREFIX)) return null;
  try {
    const json = base64UrlDecode(trimmed.slice(RESULT_CODE_PREFIX.length));
    const payload = JSON.parse(json);
    if (payload.v !== 1 || typeof payload.d !== 'number' || typeof payload.i !== 'string' || !Array.isArray(payload.t)) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}
