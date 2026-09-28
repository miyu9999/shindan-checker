const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const page = await browser.newPage();
  const fileUrl = 'file://' + path.resolve(__dirname, 'index.html');

  let failures = 0;
  function check(label, condition) {
    console.log(`  ${condition ? 'OK  ' : 'FAIL'} ${label}`);
    if (!condition) failures++;
  }

  async function getVisibleTasks() {
    return page.$$eval('#task-categories .task-row', rows => rows.map(row => {
      const input = row.querySelector('input[type=checkbox]');
      const label = row.querySelector('label');
      return { id: input.id, name: label.textContent.trim() };
    }));
  }

  async function checkTasksByName(names) {
    const tasks = await getVisibleTasks();
    for (const name of names) {
      const t = tasks.find(x => x.name.startsWith(name));
      if (!t) throw new Error(`task not found on screen: ${name}`);
      await page.click(`#${t.id}`);
    }
  }

  async function setDetail(taskNamePrefix, { time, pain }) {
    const tasks = await getVisibleTasks();
    const t = tasks.find(x => x.name.startsWith(taskNamePrefix));
    if (!t) throw new Error(`task not found for detail: ${taskNamePrefix}`);
    if (time) await page.select(`#${t.id}-time`, time);
    if (pain) await page.click(`input[name="${t.id}-pain"][value="${pain}"]`);
  }

  async function setReasons(taskNamePrefix, reasonValues, otherText) {
    await page.evaluate((prefix, values, other) => {
      const cards = Array.from(document.querySelectorAll('#task-reasons .reason-card'));
      const card = cards.find(c => c.querySelector('.task-name').textContent.trim().startsWith(prefix));
      if (!card) throw new Error('reason card not found: ' + prefix);
      values.forEach(v => {
        const cb = Array.from(card.querySelectorAll('input[type=checkbox]')).find(i => i.value === v);
        if (!cb) throw new Error('reason option not found: ' + v);
        cb.checked = true;
      });
      if (other) {
        card.querySelector('input[type=text]').value = other;
      }
    }, taskNamePrefix, reasonValues, otherText || '');
  }

  async function runToTasks(industryId, roleId) {
    await page.goto(fileUrl, { waitUntil: 'load' });
    await page.click('#screen-intro button');
    await page.click(`button[onclick="selectIndustry('${industryId}')"]`);
    const roleScreenActive = await page.$eval('#screen-role', el => el.classList.contains('active'));
    if (roleScreenActive) {
      await page.click(`button[onclick="selectRole('${roleId}')"]`);
    }
  }

  // details までを進める。ここで STEP5 の「次へ」をクリックすると
  // つらい業務があれば screen-reasons へ、なければ直接 screen-result へ遷移する。
  async function proceedThroughDetails(weeklyHours, checkNames, detailFn) {
    await page.type('#input-weekly-hours', String(weeklyHours));
    await page.click('#screen-hours button:last-child');
    await checkTasksByName(checkNames);
    await page.click('#screen-tasks button:last-child');
    await detailFn();
    await page.click('#screen-details button:last-child');
  }

  async function reasonsScreenActive() {
    return page.$eval('#screen-reasons', el => el.classList.contains('active'));
  }

  // --- Scenario 1: 「同じ内容を何度も書く」が最大 → 定型メッセージ ---
  console.log('--- Scenario 1: 定型（記録の重複）が最大になる入力 ---');
  await runToTasks('office', 'staff');
  await proceedThroughDetails(20, ['書類の作成・印刷', 'データ入力・システムへの反映'], async () => {
    await setDetail('書類の作成・印刷', { time: '5時間以上', pain: 'つらい' });
    await setDetail('データ入力・システムへの反映', { time: '3〜5時間', pain: 'ややつらい' });
  });
  check('理由選択画面に遷移する', await reasonsScreenActive());
  await setReasons('書類の作成・印刷', [REASON('同じ内容を何度も書く・入力する')]);
  await setReasons('データ入力・システムへの反映', [REASON('同じ内容を何度も書く・入力する')]);
  await page.click('#screen-reasons button:last-child');
  {
    const mainText = await page.$eval('#result-main', el => el.innerText);
    check('メインメッセージに「定型」が含まれる', mainText.includes('定型'));
  }

  // --- Scenario 2: 対人が最大、定型・調整の補足あり ---
  console.log('--- Scenario 2: 対人が最大、定型・調整の補足あり ---');
  await runToTasks('office', 'staff');
  await proceedThroughDetails(20, ['来客対応のクレーム・苦情', '未収金・支払いの催促', '書類の作成・印刷', '会議・打ち合わせ'], async () => {
    await setDetail('来客対応のクレーム・苦情', { time: '5時間以上', pain: 'つらい' });
    await setDetail('未収金・支払いの催促', { time: '5時間以上', pain: 'つらい' });
    await setDetail('書類の作成・印刷', { time: '5時間以上', pain: 'ややつらい' });
    await setDetail('会議・打ち合わせ', { time: '3〜5時間', pain: 'ややつらい' });
  });
  await setReasons('来客対応のクレーム・苦情', [REASON('人への対応が精神的にしんどい')]);
  await setReasons('未収金・支払いの催促', [REASON('人への対応が精神的にしんどい')]);
  await setReasons('書類の作成・印刷', [REASON('手順が面倒・道具やシステムが使いにくい')]);
  await setReasons('会議・打ち合わせ', [REASON('人や日程の調整が大変・待たされる')]);
  await page.click('#screen-reasons button:last-child');
  {
    const mainText = await page.$eval('#result-main', el => el.innerText);
    check('メインメッセージに「対人」が含まれる', mainText.includes('対人'));
    check('補足メッセージ（ツールで減らせる可能性）が出る', mainText.includes('ツールで減らせる可能性があります'));
  }

  // --- Scenario 3: 時間外・二度手間の業務が一覧表示される（1業務で理由を2つ選ぶ） ---
  console.log('--- Scenario 3: 時間外・二度手間の業務が一覧表示される ---');
  await runToTasks('office', 'staff');
  await proceedThroughDetails(20, ['書類の作成・印刷'], async () => {
    await setDetail('書類の作成・印刷', { time: '1〜3時間', pain: 'ややつらい' });
  });
  await setReasons('書類の作成・印刷', [
    REASON('時間内に終わらず、時間外にやっている'),
    REASON('同じ内容を何度も書く・入力する'),
  ]);
  await page.click('#screen-reasons button:last-child');
  {
    const overtimeText = await page.$eval('#result-overtime', el => el.innerText);
    const duplicateText = await page.$eval('#result-duplicate', el => el.innerText);
    check('時間外セクションに業務名が出る', overtimeText.includes('書類の作成・印刷'));
    check('二度手間セクションに業務名が出る', duplicateText.includes('書類の作成・印刷'));
  }

  // --- Scenario 4: 業務量が勤務時間を超える ---
  console.log('--- Scenario 4: 合計時間が勤務時間を超える ---');
  await runToTasks('office', 'staff');
  await proceedThroughDetails(3, ['書類の作成・印刷', 'データ入力・システムへの反映'], async () => {
    await setDetail('書類の作成・印刷', { time: '5時間以上', pain: 'つらい' });
    await setDetail('データ入力・システムへの反映', { time: '5時間以上', pain: 'つらい' });
  });
  await setReasons('書類の作成・印刷', [REASON('量が多い・時間が足りない')]);
  await setReasons('データ入力・システムへの反映', [REASON('量が多い・時間が足りない')]);
  await page.click('#screen-reasons button:last-child');
  {
    const workloadText = await page.$eval('#result-workload', el => el.innerText);
    check('業務量が多い旨の注記が出る', workloadText.includes('業務量そのものが多い可能性があります'));
  }

  // --- Scenario 5: 管理職限定業務がスタッフ選択時に非表示 ---
  console.log('--- Scenario 5: 管理職限定業務がスタッフ選択時に非表示 ---');
  await runToTasks('office', 'staff');
  await page.type('#input-weekly-hours', '20');
  await page.click('#screen-hours button:last-child');
  {
    const tasks = await getVisibleTasks();
    check('管理職限定「シフト・人員配置の作成」が表示されない', !tasks.some(t => t.name.startsWith('シフト・人員配置の作成')));
  }

  // --- Scenario 6: 共通業務がカテゴリとして表示される ---
  console.log('--- Scenario 6: 共通業務がカテゴリとして表示される ---');
  await runToTasks('retail', 'staff');
  await page.type('#input-weekly-hours', '20');
  await page.click('#screen-hours button:last-child');
  {
    const html = await page.$eval('#task-categories', el => el.innerHTML);
    check('共通カテゴリの見出しが出る', html.includes('共通（どの仕事にもある業務）'));
    check('共通業務「上司・同僚との人間関係」が出る', html.includes('上司・同僚との人間関係'));
  }

  // --- Scenario 7: 役割ごとにカテゴリが丸ごと切り替わる業種（医師） ---
  console.log('--- Scenario 7: 研修医を選ぶと勤務医カテゴリの業務が出ない ---');
  await runToTasks('doctor', 'resident');
  await page.type('#input-weekly-hours', '40');
  await page.click('#screen-hours button:last-child');
  {
    const tasks = await getVisibleTasks();
    check('研修医の業務「オーダー入力」が表示される', tasks.some(t => t.name.startsWith('オーダー入力')));
    check('勤務医限定「外来診察」が表示されない', !tasks.some(t => t.name.startsWith('外来診察')));
    check('管理職限定「診療科の人員配置」が表示されない', !tasks.some(t => t.name.startsWith('診療科の人員配置')));
  }

  // --- Scenario 8: 「あまりつらくない」の業務は理由画面が出ない ---
  console.log('--- Scenario 8: あまりつらくないだけを選ぶと理由画面がスキップされる ---');
  await runToTasks('office', 'staff');
  await page.type('#input-weekly-hours', '20');
  await page.click('#screen-hours button:last-child');
  await checkTasksByName(['書類の作成・印刷']);
  await page.click('#screen-tasks button:last-child');
  await setDetail('書類の作成・印刷', { time: '30分未満', pain: 'あまりつらくない' });
  await page.click('#screen-details button:last-child');
  {
    const resultActive = await page.$eval('#screen-result', el => el.classList.contains('active'));
    check('理由画面を経由せず結果画面に直接遷移する', resultActive);
  }

  // --- Scenario 9: 1業務で複数の理由を選んだときのスコア按分 ---
  console.log('--- Scenario 9: 複数理由の按分（判断/身体を50%ずつ選ぶ） ---');
  await runToTasks('office', 'staff');
  await proceedThroughDetails(20, ['契約書・請求書の確認'], async () => {
    await setDetail('契約書・請求書の確認', { time: '1〜3時間', pain: 'つらい' });
  });
  await setReasons('契約書・請求書の確認', [
    REASON('判断が難しい・迷う'),
    REASON('体力的にきつい'),
  ]);
  await page.click('#screen-reasons button:last-child');
  {
    const breakdownText = await page.$eval('#result-tag-breakdown', el => el.innerText);
    check('理由別内訳に「判断」が50%で出る', /判断[\s\S]{0,20}50%/.test(breakdownText));
    check('理由別内訳に「身体」が50%で出る', /身体[\s\S]{0,20}50%/.test(breakdownText));
  }

  // --- Scenario 10: 個人結果コード→職場集計（5人分そろうと結果が出る） ---
  console.log('--- Scenario 10: 5人分のコードで集計結果が出る、4人分では出ない ---');
  const codes = [];
  for (let i = 0; i < 5; i++) {
    await runToTasks('retail', 'staff');
    await proceedThroughDetails(20, ['レジ対応・会計'], async () => {
      await setDetail('レジ対応・会計', { time: '1〜3時間', pain: 'つらい' });
    });
    await setReasons('レジ対応・会計', [REASON('判断が難しい・迷う')]);
    await page.click('#screen-reasons button:last-child');
    codes.push(await page.$eval('#result-code', el => el.value));
  }

  const aggUrl = 'file://' + path.resolve(__dirname, 'aggregate.html');
  await page.goto(aggUrl, { waitUntil: 'load' });
  await page.type('#code-input', codes.slice(0, 4).join('\n'));
  await page.click('.card button');
  {
    const needMoreText = await page.$eval('#agg-need-more', el => el.innerText);
    check('4人分では「あと1人分必要」と出る', needMoreText.includes('あと1人分'));
    const display = await page.$eval('#agg-result-card', el => el.style.display);
    check('4人分では結果カードが表示されない', display !== 'block');
  }

  await page.goto(aggUrl, { waitUntil: 'load' });
  await page.type('#code-input', codes.join('\n'));
  await page.click('.card button');
  {
    const display = await page.$eval('#agg-result-card', el => el.style.display);
    check('5人分で結果カードが表示される', display === 'block');
    const countText = await page.$eval('#agg-response-count', el => el.innerText);
    check('回答人数が5人と表示される', countText.includes('5人'));
    const rankingText = await page.$eval('#agg-ranking', el => el.innerText);
    check('ランキングに「レジ対応・会計」×「判断が難しい・迷う」が出る',
      rankingText.includes('レジ対応・会計') && rankingText.includes('判断が難しい・迷う'));
  }

  // --- Scenario 11: ランキングが優先度スコアの高い順に並ぶ ---
  console.log('--- Scenario 11: ランキングが優先度スコア順に並ぶ ---');
  const highScoreCodes = [];
  for (let i = 0; i < 5; i++) {
    await runToTasks('retail', 'staff');
    await proceedThroughDetails(20, ['クレーム・返品対応'], async () => {
      await setDetail('クレーム・返品対応', { time: '5時間以上', pain: 'つらい' });
    });
    await setReasons('クレーム・返品対応', [REASON('人への対応が精神的にしんどい')]);
    await page.click('#screen-reasons button:last-child');
    highScoreCodes.push(await page.$eval('#result-code', el => el.value));
  }
  const lowScoreCodes = [];
  for (let i = 0; i < 2; i++) {
    await runToTasks('retail', 'staff');
    await proceedThroughDetails(20, ['品出し・陳列'], async () => {
      await setDetail('品出し・陳列', { time: '30分未満', pain: 'ややつらい' });
    });
    await setReasons('品出し・陳列', [REASON('体力的にきつい')]);
    await page.click('#screen-reasons button:last-child');
    lowScoreCodes.push(await page.$eval('#result-code', el => el.value));
  }
  await page.goto(aggUrl, { waitUntil: 'load' });
  await page.type('#code-input', [...highScoreCodes, ...lowScoreCodes].join('\n'));
  await page.click('.card button');
  {
    const firstRankTitle = await page.$eval('#agg-ranking .rank-row:first-child .rank-title', el => el.innerText);
    check('1位が「クレーム・返品対応 × 人への対応が精神的にしんどい」',
      firstRankTitle.includes('クレーム・返品対応') && firstRankTitle.includes('人への対応が精神的にしんどい'));
  }

  // --- Scenario 12: コードに自由記述・勤務時間が含まれない ---
  console.log('--- Scenario 12: コードに自由記述・勤務時間の具体的な数字が含まれない ---');
  await runToTasks('retail', 'staff');
  await proceedThroughDetails(37, ['レジ対応・会計'], async () => {
    await setDetail('レジ対応・会計', { time: '1〜3時間', pain: 'つらい' });
  });
  await setReasons('レジ対応・会計', [REASON('判断が難しい・迷う')], 'ヒミツの自由記述テキスト12345');
  await page.click('#screen-reasons button:last-child');
  {
    const code = await page.$eval('#result-code', el => el.value);
    const decoded = await page.evaluate((c) => JSON.stringify(parseResultCode(c)), code);
    check('デコードしたペイロードに勤務時間(37)が含まれない', !decoded.includes('37'));
    check('デコードしたペイロードに自由記述が含まれない', !decoded.includes('ヒミツ'));
  }

  // --- Scenario 13: 不正なコードが件数付きで除外される ---
  console.log('--- Scenario 13: 業種違い・版違い・壊れたコード・重複が除外され件数表示される ---');
  // コードは個人を識別する情報を持たないため、同じ入力なら同じコードになる（仕様通り）。
  // 「意図しない偶然の重複」と「意図した重複」を区別するため、5人分は時間・つらさを少しずつ変える。
  const distinctInputs = [
    { time: '1〜3時間', pain: 'つらい' },
    { time: '3〜5時間', pain: 'つらい' },
    { time: '5時間以上', pain: 'つらい' },
    { time: '1〜3時間', pain: 'ややつらい' },
    { time: '30分〜1時間', pain: 'つらい' },
  ];
  const validCodes = [];
  for (const input of distinctInputs) {
    await runToTasks('retail', 'staff');
    await proceedThroughDetails(20, ['レジ対応・会計'], async () => {
      await setDetail('レジ対応・会計', input);
    });
    await setReasons('レジ対応・会計', [REASON('判断が難しい・迷う')]);
    await page.click('#screen-reasons button:last-child');
    validCodes.push(await page.$eval('#result-code', el => el.value));
  }

  await runToTasks('office', 'staff');
  await proceedThroughDetails(20, ['書類の作成・印刷'], async () => {
    await setDetail('書類の作成・印刷', { time: '1〜3時間', pain: 'つらい' });
  });
  await setReasons('書類の作成・印刷', [REASON('同じ内容を何度も書く・入力する')]);
  await page.click('#screen-reasons button:last-child');
  const wrongIndustryCode = await page.$eval('#result-code', el => el.value);

  const brokenCode = 'SK1-これは壊れたコードです';

  const wrongVersionCode = await page.evaluate((c) => {
    const payload = parseResultCode(c);
    payload.d = payload.d + 999;
    return RESULT_CODE_PREFIX + base64UrlEncode(JSON.stringify(payload));
  }, validCodes[0]);

  await page.goto(aggUrl, { waitUntil: 'load' });
  const allLines = [...validCodes, wrongIndustryCode, brokenCode, wrongVersionCode, validCodes[0]];
  await page.type('#code-input', allLines.join('\n'));
  await page.click('.card button');
  {
    const errorsText = await page.$eval('#agg-errors', el => el.innerText);
    check('読み取れないコードの件数が表示される', errorsText.includes('読み取れないコードが1件'));
    check('業種違いの件数が表示される', errorsText.includes('業種が異なるコードが1件'));
    check('古い版の件数が表示される', errorsText.includes('古い版のコードが1件'));
    check('重複コードの件数が表示される', errorsText.includes('同じコードが1件重複'));
    const display = await page.$eval('#agg-result-card', el => el.style.display);
    check('有効な5件で結果が表示される', display === 'block');
  }

  await browser.close();

  console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`);
  if (failures > 0) process.exit(1);
})().catch(e => { console.error('TEST FAILED:', e); process.exit(1); });

// 共通の理由リスト（index.html の REASONS と同じ文字列）。定義を複製せず、
// テストの可読性のために短い名前を通すためだけのヘルパー。
function REASON(text) { return text; }
