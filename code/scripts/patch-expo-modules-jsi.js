const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(
  projectRoot,
  'node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh'
);
const productsPath = path.join(
  projectRoot,
  'node_modules/expo-modules-jsi/apple/Products'
);

// 1. Patch build-xcframework.sh sed regex
if (fs.existsSync(scriptPath)) {
  let content = fs.readFileSync(scriptPath, 'utf8');
  if (content.includes('/^extension __ObjC\\./')) {
    content = content.replace(
      'sed \'/^extension __ObjC\\./,/^}/d;',
      'sed \'/^extension __ObjC[\\.:]/,/^}/d;'
    );
    fs.writeFileSync(scriptPath, content, 'utf8');
    console.log('[patch-expo-modules-jsi] Patched build-xcframework.sh regex.');
  }
}

// 2. Strip any unstripped __ObjC blocks from existing .swiftinterface files
function stripSwiftInterfaces(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      stripSwiftInterfaces(fullPath);
    } else if (entry.name.endsWith('.swiftinterface')) {
      const original = fs.readFileSync(fullPath, 'utf8');
      const stripped = original.replace(/^extension __ObjC[\s\S]*?^}\n?/gm, '');
      if (original !== stripped) {
        fs.writeFileSync(fullPath, stripped, 'utf8');
        console.log(`[patch-expo-modules-jsi] Cleaned ${entry.name}`);
      }
    }
  }
}

stripSwiftInterfaces(productsPath);

// 3. Patch expo-constants for path with spaces
const constantsScriptPath = path.join(
  projectRoot,
  'node_modules/expo-constants/scripts/get-app-config-ios.sh'
);
if (fs.existsSync(constantsScriptPath)) {
  let content = fs.readFileSync(constantsScriptPath, 'utf8');
  if (content.includes('basename $PROJECT_DIR')) {
    content = content.replace('basename $PROJECT_DIR', 'basename "$PROJECT_DIR"');
    fs.writeFileSync(constantsScriptPath, content, 'utf8');
    console.log('[patch-expo-modules-jsi] Patched get-app-config-ios.sh for paths with spaces.');
  }
}

const constantsPodspecPath = path.join(
  projectRoot,
  'node_modules/expo-constants/ios/EXConstants.podspec'
);
if (fs.existsSync(constantsPodspecPath)) {
  let content = fs.readFileSync(constantsPodspecPath, 'utf8');
  if (content.includes('bash -l -c "#{env_vars}$PODS_TARGET_SRCROOT')) {
    content = content.replace(
      'bash -l -c "#{env_vars}$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh"',
      'bash -l -c "#{env_vars}\\\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\\""'
    );
    fs.writeFileSync(constantsPodspecPath, content, 'utf8');
    console.log('[patch-expo-modules-jsi] Patched EXConstants.podspec for paths with spaces.');
  }
}

const pbxprojPath = path.join(
  projectRoot,
  'ios/Pods/Pods.xcodeproj/project.pbxproj'
);
if (fs.existsSync(pbxprojPath)) {
  let content = fs.readFileSync(pbxprojPath, 'utf8');
  if (content.includes('bash -l -c \\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"')) {
    content = content.replace(
      'bash -l -c \\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\"',
      'bash -l -c \\"\\\\\\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\\\\\"\\"'
    );
    fs.writeFileSync(pbxprojPath, content, 'utf8');
    console.log('[patch-expo-modules-jsi] Patched Pods.xcodeproj for paths with spaces.');
  }
}

// 4. Ensure codegen artifacts and autolinking output exist
const appDepProviderPath = path.join(
  projectRoot,
  'ios/build/generated/ios/ReactAppDependencyProvider/RCTAppDependencyProvider.mm'
);
if (!fs.existsSync(appDepProviderPath)) {
  try {
    const { execSync } = require('child_process');
    execSync('node ./node_modules/react-native/scripts/generate-codegen-artifacts.js -p . -o ./ios -t ios', {
      cwd: projectRoot,
      stdio: 'ignore'
    });
    console.log('[patch-expo-modules-jsi] Generated codegen artifacts.');
  } catch (e) {
    console.warn('[patch-expo-modules-jsi] Could not generate codegen artifacts:', e.message);
  }
}

const autolinkingPath = path.join(
  projectRoot,
  'ios/build/generated/autolinking/autolinking.json'
);
if (!fs.existsSync(autolinkingPath)) {
  try {
    const { execSync } = require('child_process');
    const out = execSync("node --no-warnings --eval 'require(\"expo/bin/autolinking\")' expo-modules-autolinking react-native-config --json --platform ios", {
      cwd: projectRoot,
      encoding: 'utf8'
    });
    fs.mkdirSync(path.dirname(autolinkingPath), { recursive: true });
    fs.writeFileSync(autolinkingPath, out);
    console.log('[patch-expo-modules-jsi] Generated autolinking.json.');
  } catch (e) {
    console.warn('[patch-expo-modules-jsi] Could not generate autolinking.json:', e.message);
  }
}

// 5. Patch Sortify.xcodeproj for paths with spaces in react-native-xcode.sh call
const sortifyPbxprojPath = path.join(
  projectRoot,
  'ios/Sortify.xcodeproj/project.pbxproj'
);
if (fs.existsSync(sortifyPbxprojPath)) {
  let content = fs.readFileSync(sortifyPbxprojPath, 'utf8');
  if (content.includes('`"$NODE_BINARY" --print "require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'"`')) {
    content = content.replace(
      '`"$NODE_BINARY" --print "require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'"`',
      '/bin/bash \\"$(\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\")\\"'
    );
    fs.writeFileSync(sortifyPbxprojPath, content, 'utf8');
    console.log('[patch-expo-modules-jsi] Patched Sortify.xcodeproj for paths with spaces.');
  }
}

// 6. Patch expo react-native-xcode.sh for paths with spaces
const expoXcodeScriptPath = path.join(
  projectRoot,
  'node_modules/expo/scripts/react-native-xcode.sh'
);
if (fs.existsSync(expoXcodeScriptPath)) {
  let content = fs.readFileSync(expoXcodeScriptPath, 'utf8');
  let changed = false;
  if (content.includes('DEST=$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH')) {
    content = content.replace(
      'DEST=$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH',
      'DEST="$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"'
    );
    changed = true;
  }
  if (content.includes('HERMES_ENABLED=$(grep hermes-engine $PODS_PODFILE_DIR_PATH/Podfile.lock)')) {
    content = content.replace(
      'HERMES_ENABLED=$(grep hermes-engine $PODS_PODFILE_DIR_PATH/Podfile.lock)',
      'HERMES_ENABLED=$(grep hermes-engine "$PODS_PODFILE_DIR_PATH/Podfile.lock")'
    );
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(expoXcodeScriptPath, content, 'utf8');
    console.log('[patch-expo-modules-jsi] Patched expo/scripts/react-native-xcode.sh for paths with spaces.');
  }
}

