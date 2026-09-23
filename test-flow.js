const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const page = await browser.newPage();
  const fileUrl = 'file://' + path.resolve(__dirname, 'index.html');

  async function runScenario(name, answers) {
    await page.goto(fileUrl, { waitUntil: 'load' });
    await page.click('#screen-intro button');
    // stage1: just click next without filling (should be allowed, no validation on stage1)
    await page.click('#screen-stage1 button:last-child');
    // stage2: answer 5 questions
    for (const [key, value] of Object.entries(answers)) {
      const selector = `.radio-options[data-key="${key}"] input[value="${value}"]`;
      await page.click(selector);
    }
    await page.click('#screen-stage2 button:last-child');
    const resultVisible = await page.$eval('#screen-result', el => el.classList.contains('active'));
    const messageText = await page.$eval('#result-message', el => el.innerText);
    console.log(`--- ${name} ---`);
    console.log('result screen active:', resultVisible);
    console.log('message:', messageText.slice(0, 80).replace(/\n/g, ' '));
  }

  await runScenario('B/C heavy (should be ①対象)', {
    A: '当てはまらない',
    B: '当てはまる',
    C: '当てはまる',
    D: '当てはまらない',
    E: '当てはまらない',
  });

  await runScenario('D/E heavy (should be 対象外)', {
    A: '当てはまらない',
    B: '当てはまらない',
    C: '当てはまらない',
    D: '当てはまる',
    E: '当てはまる',
  });

  await runScenario('Tie case', {
    A: '当てはまらない',
    B: '当てはまる',
    C: '当てはまらない',
    D: '当てはまる',
    E: '当てはまらない',
  });

  await browser.close();
})().catch(e => { console.error('TEST FAILED:', e); process.exit(1); });
