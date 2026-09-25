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

  // Returns { id, name, tag } for all task-rows currently rendered on screen-tasks
  async function getVisibleTasks() {
    return page.$$eval('#task-categories .task-row', rows => rows.map(row => {
      const input = row.querySelector('input[type=checkbox]');
      const label = row.querySelector('label');
      return {
        id: input.id,
        name: label.textContent.replace(/\s+$/, '').split('\n')[0].trim(),
      };
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

  async function setDetail(taskNamePrefix, { time, pain, overtime, duplicate }) {
    const tasks = await getVisibleTasks();
    const t = tasks.find(x => x.name.startsWith(taskNamePrefix));
    if (!t) throw new Error(`task not found for detail: ${taskNamePrefix}`);
    if (time) await page.select(`#${t.id}-time`, time);
    if (pain) await page.click(`input[name="${t.id}-pain"][value="${pain}"]`);
    if (overtime) await page.click(`#${t.id}-overtime`);
    if (duplicate) await page.click(`#${t.id}-duplicate`);
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

  async function proceedToResult(weeklyHours, checkNames, detailFn) {
    await page.type('#input-weekly-hours', String(weeklyHours));
    await page.click('#screen-hours button:last-child');
    await checkTasksByName(checkNames);
    await page.click('#screen-tasks button:last-child');
    await detailFn();
    await page.click('#screen-details button:last-child');
  }

  // --- Scenario 1: 定型が最大 ---
  console.log('--- Scenario 1: 定型が最大になる入力 ---');
  await runToTasks('office', 'staff');
  await proceedToResult(20, ['書類の作成・印刷', 'データ入力・システムへの反映'], async () => {
    await setDetail('書類の作成・印刷', { time: '5時間以上', pain: 'つらい' });
    await setDetail('データ入力・システムへの反映', { time: '3〜5時間', pain: 'ややつらい' });
  });
  {
    const mainText = await page.$eval('#result-main', el => el.innerText);
    check('メインメッセージに「定型」が含まれる', mainText.includes('定型'));
  }

  // --- Scenario 2: 対人が最大 + 定型・調整が2割以上 ---
  console.log('--- Scenario 2: 対人が最大、定型・調整の補足あり ---');
  await runToTasks('office', 'staff');
  await proceedToResult(20, ['来客対応のクレーム・苦情', '未収金・支払いの催促', '書類の作成・印刷', '会議・打ち合わせ'], async () => {
    await setDetail('来客対応のクレーム・苦情', { time: '5時間以上', pain: 'つらい' });
    await setDetail('未収金・支払いの催促', { time: '5時間以上', pain: 'つらい' });
    await setDetail('書類の作成・印刷', { time: '5時間以上', pain: 'ややつらい' });
    await setDetail('会議・打ち合わせ', { time: '3〜5時間', pain: 'ややつらい' });
  });
  {
    const mainText = await page.$eval('#result-main', el => el.innerText);
    check('メインメッセージに「対人」が含まれる', mainText.includes('対人'));
    check('補足メッセージ（ツールで減らせる可能性）が出る', mainText.includes('ツールで減らせる可能性があります'));
  }

  // --- Scenario 3: 時間外・二度手間の一覧表示 ---
  console.log('--- Scenario 3: 時間外・二度手間の業務が一覧表示される ---');
  await runToTasks('office', 'staff');
  await proceedToResult(20, ['書類の作成・印刷'], async () => {
    await setDetail('書類の作成・印刷', { time: '1〜3時間', pain: 'ややつらい', overtime: true, duplicate: true });
  });
  {
    const overtimeText = await page.$eval('#result-overtime', el => el.innerText);
    const duplicateText = await page.$eval('#result-duplicate', el => el.innerText);
    check('時間外セクションに業務名が出る', overtimeText.includes('書類の作成・印刷'));
    check('二度手間セクションに業務名が出る', duplicateText.includes('書類の作成・印刷'));
  }

  // --- Scenario 4: 業務量が勤務時間を超える ---
  console.log('--- Scenario 4: 合計時間が勤務時間を超える ---');
  await runToTasks('office', 'staff');
  await proceedToResult(3, ['書類の作成・印刷', 'データ入力・システムへの反映'], async () => {
    await setDetail('書類の作成・印刷', { time: '5時間以上', pain: 'つらい' });
    await setDetail('データ入力・システムへの反映', { time: '5時間以上', pain: 'つらい' });
  });
  {
    const workloadText = await page.$eval('#result-workload', el => el.innerText);
    check('業務量が多い旨の注記が出る', workloadText.includes('業務量そのものが多い可能性があります'));
  }

  // --- Scenario 5: 管理職限定の業務がスタッフには表示されない ---
  console.log('--- Scenario 5: 管理職限定業務がスタッフ選択時に非表示 ---');
  await runToTasks('office', 'staff');
  await page.type('#input-weekly-hours', '20');
  await page.click('#screen-hours button:last-child');
  {
    const tasks = await getVisibleTasks();
    check('管理職限定「シフト・人員配置の作成」が表示されない', !tasks.some(t => t.name.startsWith('シフト・人員配置の作成')));
  }

  // --- Scenario 6: 共通業務がどの業種でも表示される ---
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

  await browser.close();

  console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURE(S)'}`);
  if (failures > 0) process.exit(1);
})().catch(e => { console.error('TEST FAILED:', e); process.exit(1); });
