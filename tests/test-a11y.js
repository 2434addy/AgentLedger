/**
 * Accessibility smoke test — static analysis of .tsx source files.
 * Checks for WCAG AA compliance patterns without requiring a running server.
 * Run with: node tests/test-a11y.js
 */
const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32mPASS\x1b[0m  ${name}`);
  } else {
    failed++;
    console.log(`  \x1b[31mFAIL\x1b[0m  ${name}`);
  }
}

function readFile(relPath) {
  const fullPath = path.join(__dirname, '..', relPath);
  try {
    return fs.readFileSync(fullPath, 'utf8');
  } catch {
    return null;
  }
}

function findTsxFiles(dir) {
  const results = [];
  const fullDir = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullDir)) return results;
  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  for (const entry of entries) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findTsxFiles(rel));
    } else if (entry.name.endsWith('.tsx')) {
      results.push(rel);
    }
  }
  return results;
}

console.log('\n  WCAG AA Accessibility Smoke Test\n');

// ─── 1. Skip-to-content link exists ─────────────────────────────────────────
console.log('  --- Skip-to-content ---');
const rootLayout = readFile('frontend/src/app/layout.tsx');
check('Root layout has skip-to-content link', rootLayout && rootLayout.includes('skip-to-content'));
check('Skip link targets #main-content', rootLayout && rootLayout.includes('#main-content'));

// ─── 2. Dashboard layout accessibility ──────────────────────────────────────
console.log('  --- Dashboard layout ---');
const dashLayout = readFile('frontend/src/app/(dashboard)/layout.tsx');
check('Dashboard has main-content id target', dashLayout && dashLayout.includes('id="main-content"'));
check('Sidebar has aria-label', dashLayout && /aria-label/.test(dashLayout));
check('Nav has role or aria-label', dashLayout && (/role="navigation"|aria-label=".*navigation"/i).test(dashLayout));
check('Active nav item has aria-current="page"', dashLayout && dashLayout.includes('aria-current'));
check('Hamburger button has aria-label', dashLayout && /aria-label=".*menu/i.test(dashLayout));
check('Hamburger button has aria-expanded', dashLayout && dashLayout.includes('aria-expanded'));
check('Icon elements have aria-hidden', dashLayout && dashLayout.includes('aria-hidden="true"'));
check('Loading state has role="status"', dashLayout && dashLayout.includes('role="status"'));
check('Top bar has role="banner"', dashLayout && dashLayout.includes('role="banner"'));

// ─── 3. Mobile responsive sidebar ──────────────────────────────────────────
console.log('  --- Mobile responsive sidebar ---');
check('Dashboard imports Menu icon (hamburger)', dashLayout && dashLayout.includes('Menu'));
check('Dashboard has sidebarOpen state', dashLayout && dashLayout.includes('sidebarOpen'));
check('Dashboard has sidebar-open CSS class', dashLayout && dashLayout.includes('sidebar-open'));
check('Dashboard uses lg: breakpoint for margin', dashLayout && dashLayout.includes('lg:ml-'));
check('Dashboard has mobile padding', dashLayout && /p-4\s+lg:p-8/.test(dashLayout));

// ─── 4. CSS focus-visible and reduced motion ───────────────────────────────
console.log('  --- CSS accessibility ---');
const glassCss = readFile('frontend/src/styles/glass.css');
check('CSS has focus-visible styles', glassCss && glassCss.includes('focus-visible'));
check('CSS has prefers-reduced-motion', glassCss && glassCss.includes('prefers-reduced-motion'));
check('CSS has skip-to-content styles', glassCss && glassCss.includes('.skip-to-content'));
check('CSS has sidebar-open class for mobile', glassCss && glassCss.includes('.sidebar-open'));
check('CSS has sidebar overlay', glassCss && glassCss.includes('.sidebar-overlay'));

// ─── 5. Auth pages have proper form labels ─────────────────────────────────
console.log('  --- Auth page form labels ---');
const loginPage = readFile('frontend/src/app/(auth)/login/page.tsx');
check('Login has htmlFor on labels', loginPage && loginPage.includes('htmlFor'));
check('Login has id on inputs', loginPage && loginPage.includes('id="login-'));
check('Login error has role="alert"', loginPage && loginPage.includes('role="alert"'));
check('Login password toggle has aria-label', loginPage && /aria-label=.*password/i.test(loginPage));

const signupPage = readFile('frontend/src/app/(auth)/signup/page.tsx');
check('Signup has htmlFor on labels', signupPage && signupPage.includes('htmlFor'));
check('Signup has id on inputs', signupPage && signupPage.includes('id="signup-'));
check('Signup error has role="alert"', signupPage && signupPage.includes('role="alert"'));
check('Signup password toggle has aria-label', signupPage && /aria-label=.*password/i.test(signupPage));

// ─── 6. All icon-only buttons have aria-labels ─────────────────────────────
console.log('  --- Icon-only button audit ---');
const tsxFiles = findTsxFiles('frontend/src/app');
let iconButtonsWithoutLabel = 0;
let totalIconButtons = 0;
for (const file of tsxFiles) {
  const content = readFile(file);
  if (!content) continue;
  // Find buttons that only contain icon components (no text children)
  const buttonMatches = content.match(/<button[^>]*>[\s\S]*?<\/button>/g) || [];
  for (const btn of buttonMatches) {
    // Check if button content is only an icon (Lucide icons are PascalCase self-closing)
    const hasOnlyIcon = /<button[^>]*>\s*\{?[^<]*<[A-Z][a-zA-Z]+\s[^/]*\/>\s*\}?\s*<\/button>/.test(btn);
    if (hasOnlyIcon) {
      totalIconButtons++;
      if (!btn.includes('aria-label')) {
        iconButtonsWithoutLabel++;
      }
    }
  }
}
check(`All icon-only buttons have aria-label (${totalIconButtons - iconButtonsWithoutLabel}/${totalIconButtons})`,
  iconButtonsWithoutLabel === 0);

// ─── Summary ────────────────────────────────────────────────────────────────
console.log(`\n  ─────────────────────────────────`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`  ─────────────────────────────────\n`);

process.exit(failed > 0 ? 1 : 0);
