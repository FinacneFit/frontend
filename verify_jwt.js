const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. 랜딩 페이지 접근
  console.log('\n=== 1. 랜딩 페이지 접근 ===');
  await page.goto('http://localhost:5174/');
  await page.waitForLoadState('networkidle');
  const url1 = page.url();
  const signupBtn = await page.locator('button:has-text("회원가입")').isVisible();
  const loginBtn  = await page.locator('button:has-text("로그인")').isVisible();
  console.log('URL:', url1);
  console.log('회원가입 버튼:', signupBtn);
  console.log('로그인 버튼:', loginBtn);
  await page.screenshot({ path: 'C:/Users/SSAFY/AppData/Local/Temp/step1_landing.png' });

  // 2. 로그인 페이지 이동
  console.log('\n=== 2. 로그인 페이지 이동 ===');
  await page.goto('http://localhost:5174/login');
  await page.waitForLoadState('networkidle');
  console.log('URL:', page.url());
  await page.screenshot({ path: 'C:/Users/SSAFY/AppData/Local/Temp/step2_login.png' });

  // 3. 로그인 시도
  console.log('\n=== 3. 로그인 시도 (jwttest@test.com) ===');
  await page.fill('input[type="email"], input[placeholder*="이메일"], input[name="email"]', 'jwttest@test.com');
  await page.fill('input[type="password"], input[placeholder*="비밀번호"], input[name="password"]', 'Test1234!');
  await page.screenshot({ path: 'C:/Users/SSAFY/AppData/Local/Temp/step3_filled.png' });
  await page.click('button[type="submit"], button:has-text("로그인")');
  await page.waitForLoadState('networkidle');
  const url3 = page.url();
  console.log('로그인 후 URL:', url3);
  await page.screenshot({ path: 'C:/Users/SSAFY/AppData/Local/Temp/step3_after_login.png' });

  // 4. localStorage 확인
  console.log('\n=== 4. localStorage 확인 ===');
  const access  = await page.evaluate(() => localStorage.getItem('finfit_access'));
  const refresh = await page.evaluate(() => localStorage.getItem('finfit_refresh'));
  const oldToken = await page.evaluate(() => localStorage.getItem('finfit_token'));
  console.log('finfit_access:', access ? access.substring(0, 40) + '...' : 'NULL');
  console.log('finfit_refresh:', refresh ? refresh.substring(0, 40) + '...' : 'NULL');
  console.log('finfit_token(구 키):', oldToken ?? 'NULL (정상)');

  // 5. 로그인 상태에서 / 접근 시 리다이렉트
  console.log('\n=== 5. 로그인 상태에서 / 접근 ===');
  await page.goto('http://localhost:5174/');
  await page.waitForLoadState('networkidle');
  const url5 = page.url();
  console.log('/ 접근 후 URL:', url5);
  console.log('dashboard 리다이렉트:', url5.includes('/dashboard') ? '✅ 성공' : '❌ 실패');
  await page.screenshot({ path: 'C:/Users/SSAFY/AppData/Local/Temp/step5_redirect.png' });

  // 6. 로그인 상태에서 /login 접근 시 리다이렉트
  console.log('\n=== 6. 로그인 상태에서 /login 접근 ===');
  await page.goto('http://localhost:5174/login');
  await page.waitForLoadState('networkidle');
  const url6 = page.url();
  console.log('/login 접근 후 URL:', url6);
  console.log('dashboard 리다이렉트:', url6.includes('/dashboard') ? '✅ 성공' : '❌ 실패');

  await browser.close();
  console.log('\n=== 테스트 완료 ===');
})();
