const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const assetsDir = path.join(rootDir, 'assets');
const imagesDir = path.join(assetsDir, 'images');
const sourceLogo = path.join(imagesDir, 'logo.png');

if (!fs.existsSync(sourceLogo)) {
  console.error(`❌ Source logo not found at: ${sourceLogo}`);
  process.exit(1);
}

console.log('🌱 Generating standard Expo & React Native assets from Sortify logo...');

function run(cmd) {
  execSync(cmd, { stdio: 'pipe' });
}

// Temporary directory for intermediate processing
const tmpDir = path.join(imagesDir, '_tmp_assets');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

try {
  // 1. Favicon: 48x48 transparent PNG
  console.log('✨ Creating favicon.png (48x48)...');
  const faviconPath = path.join(imagesDir, 'favicon.png');
  run(`sips -z 48 48 "${sourceLogo}" --out "${faviconPath}"`);

  // 2. Splash Icon: 512x512 transparent PNG
  console.log('✨ Creating splash-icon.png (512x512)...');
  const splashPath = path.join(imagesDir, 'splash-icon.png');
  run(`sips -z 512 512 "${sourceLogo}" --out "${splashPath}"`);

  // 3. Android Adaptive Icon Foreground: 340x340 logo centered in 512x512 transparent canvas
  console.log('✨ Creating android-icon-foreground.png (512x512, 66% safe zone)...');
  const fgResized = path.join(tmpDir, 'fg_resized.png');
  const fgFinal = path.join(imagesDir, 'android-icon-foreground.png');
  run(`sips -z 340 340 "${sourceLogo}" --out "${fgResized}"`);
  run(`sips -p 512 512 "${fgResized}" --out "${fgFinal}"`);

  // 4. Android Adaptive Icon Background: 512x512 solid brand background PNG (#FAFBF7)
  console.log('✨ Creating android-icon-background.png (512x512, #FAFBF7)...');
  const bgSvg = path.join(tmpDir, 'bg.svg');
  const bgFinal = path.join(imagesDir, 'android-icon-background.png');
  fs.writeFileSync(
    bgSvg,
    `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#FAFBF7"/>
    </svg>`
  );
  run(`sips -s format png "${bgSvg}" --out "${bgFinal}"`);

  // 5. Android Adaptive Icon Monochrome: 288x288 logo centered in 432x432 canvas with Generic Gray Profile
  console.log('✨ Creating android-icon-monochrome.png (432x432)...');
  const monoResized = path.join(tmpDir, 'mono_resized.png');
  const monoGray = path.join(tmpDir, 'mono_gray.png');
  const monoFinal = path.join(imagesDir, 'android-icon-monochrome.png');
  run(`sips -z 288 288 "${sourceLogo}" --out "${monoResized}"`);
  run(`sips -m "/System/Library/ColorSync/Profiles/Generic Gray Profile.icc" "${monoResized}" --out "${monoGray}"`);
  run(`sips -p 432 432 "${monoGray}" --out "${monoFinal}"`);

  // 6. App Icon: 820x820 logo centered in 1024x1024 #FAFBF7 canvas (App Store / Play Store safe zone)
  console.log('✨ Creating icon.png (1024x1024, #FAFBF7)...');
  const iconResized = path.join(tmpDir, 'icon_resized.png');
  const iconFinal = path.join(imagesDir, 'icon.png');
  run(`sips -z 820 820 "${sourceLogo}" --out "${iconResized}"`);
  run(`sips -p 1024 1024 --padColor FAFBF7 "${iconResized}" --out "${iconFinal}"`);

  // 7. Hero Glow: 604x604 brand emerald radial glow
  console.log('✨ Creating logo-glow.png (604x604 brand radial glow)...');
  const glowSvg = path.join(tmpDir, 'glow.svg');
  const glowFinal = path.join(imagesDir, 'logo-glow.png');
  fs.writeFileSync(
    glowSvg,
    `<svg width="604" height="604" viewBox="0 0 604 604" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="emeraldGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#4CAF7A" stop-opacity="0.65"/>
          <stop offset="30%" stop-color="#4CAF7A" stop-opacity="0.45"/>
          <stop offset="60%" stop-color="#1B5E3F" stop-opacity="0.2"/>
          <stop offset="85%" stop-color="#1B5E3F" stop-opacity="0.05"/>
          <stop offset="100%" stop-color="#1B5E3F" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="302" cy="302" r="302" fill="url(#emeraldGlow)"/>
    </svg>`
  );
  run(`sips -s format png "${glowSvg}" --out "${glowFinal}"`);

  // 8. Density-scaled logos for UI components: logo@1x.png (100x100), logo@2x.png (200x200), logo@3x.png (300x300)
  console.log('✨ Creating density-scaled logos (logo@1x.png, logo@2x.png, logo@3x.png)...');
  run(`sips -z 100 100 "${sourceLogo}" --out "${path.join(imagesDir, 'logo@1x.png')}"`);
  run(`sips -z 200 200 "${sourceLogo}" --out "${path.join(imagesDir, 'logo@2x.png')}"`);
  run(`sips -z 300 300 "${sourceLogo}" --out "${path.join(imagesDir, 'logo@3x.png')}"`);

  // 9. Sortify Web Badges: Replace old expo badges
  console.log('✨ Creating Sortify badges for web footer...');
  const badgeSvg = path.join(tmpDir, 'sortify_badge.svg');
  const badgeWhiteSvg = path.join(tmpDir, 'sortify_badge_white.svg');
  
  fs.writeFileSync(
    badgeSvg,
    `<svg width="371" height="72" viewBox="0 0 371 72" xmlns="http://www.w3.org/2000/svg">
      <rect width="371" height="72" rx="36" fill="#1B5E3F"/>
      <text x="185" y="45" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="700" text-anchor="middle">Sortify</text>
    </svg>`
  );
  fs.writeFileSync(
    badgeWhiteSvg,
    `<svg width="371" height="72" viewBox="0 0 371 72" xmlns="http://www.w3.org/2000/svg">
      <rect width="371" height="72" rx="36" fill="#4CAF7A"/>
      <text x="185" y="45" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="700" text-anchor="middle">Sortify</text>
    </svg>`
  );
  run(`sips -s format png "${badgeSvg}" --out "${path.join(imagesDir, 'sortify-badge.png')}"`);
  run(`sips -s format png "${badgeWhiteSvg}" --out "${path.join(imagesDir, 'sortify-badge-white.png')}"`);

  console.log('✅ All assets generated successfully!');
} finally {
  // Clean up temporary files
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
