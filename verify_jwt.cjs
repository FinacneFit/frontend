const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('requestfailed', req => {
    if (req.url().includes('localhost:8000')) {
      console.log(`[네트워크 실패] ${req.method()} ${req.url().replace('http://localhost:8000/api','')} → ${req.failure().errorText}`);
    }
  });
  page.on('response', res => {
    if (res.url().includes('localhost:8000')) {
      console.log(`[네트워크 성공] ${res.request().method()} ${res.url().replace('http://localhost:8000/api','')} → ${res.status()}`);
    }
  });

  console.log('=== 서버 OFF 상태에서 회원가입 시도 ===');
  await page.goto('http://localhost:5174/signup');
  await page.waitForLoadState('networkidle');
  console.log('접근 URL:', page.url());

  // 폼 입력
  await page.fill('input[type="email"]', 'newuser@test.com');

  // nickname 필드 찾기
  await page.locator('input[placeholder="2~20자로 입력해주세요"]').fill('newuser');

  const pwInputs = page.locator('input[type="password"]');
  await pwInputs.nth(0).fill('Test1234!');
  await pwInputs.nth(1).fill('Test1234!');

  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const urlAfter = page.url();
  const access = await page.evaluate(() => localStorage.getItem('finfit_access'));
  const errorMsg = await page.locator('.error-text, .general-error').first().textContent().catch(() => '없음');

  console.log('\n결과:');
  console.log('회원가입 후 URL:', urlAfter);
  console.log('에러 메시지:', errorMsg);
  console.log('localStorage access 토큰:', access ? '저장됨 ❌ (문제!)' : 'NULL ✅ (정상)');

  await browser.close();
})();
