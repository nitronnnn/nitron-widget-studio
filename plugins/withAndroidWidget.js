/**
 * Config plugin: добавляет настоящий Android AppWidget (виджет домашнего экрана).
 *
 * Копирует Kotlin-исходники и res в сгенерированный android/ проект и
 * регистрирует receiver в AndroidManifest. Работает при `expo prebuild`.
 */
const { withDangerousMod, withAndroidManifest, AndroidConfig } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'android-widget');
const KOTLIN_PKG = 'com.nitron.widgetstudio.nitron';
const TICK_ACTION = 'com.nitron.widgetstudio.nitron.TICK';

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

function withAndroidWidgetSources(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const androidRoot = cfg.modRequest.platformProjectRoot; // .../android
      const appRoot = path.join(androidRoot, 'app', 'src', 'main');
      const pkg = (cfg.android && cfg.android.package) || 'com.nitron.widgetstudio';
      if (pkg !== 'com.nitron.widgetstudio') {
        throw new Error(
          `withAndroidWidget ожидает android.package = com.nitron.widgetstudio, получено: ${pkg}`,
        );
      }

      // Kotlin: src/main/java/com/nitron/widgetstudio/nitron/*.kt
      const kotlinDest = path.join(appRoot, 'java', ...KOTLIN_PKG.split('.'));
      copyDir(path.join(SRC, 'kotlin'), kotlinDest);

      // Ресурсы: layout / xml / drawable / values
      copyDir(path.join(SRC, 'res'), path.join(appRoot, 'res'));

      return cfg;
    },
  ]);
}

function withAndroidWidgetManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;

    // Разрешения для foreground-сервиса, который проигрывает GIF/видео в виджете.
    manifest.manifest['uses-permission'] = manifest.manifest['uses-permission'] || [];
    const perms = [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      'android.permission.POST_NOTIFICATIONS',
    ];
    for (const name of perms) {
      const exists = manifest.manifest['uses-permission'].some((p) => p.$ && p.$['android:name'] === name);
      if (!exists) {
        manifest.manifest['uses-permission'].push({ $: { 'android:name': name } });
      }
    }

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    app.receiver = app.receiver || [];
    app.service = app.service || [];

    const already = app.receiver.some(
      (r) => r.$ && r.$['android:name'] === '.nitron.NitronWidgetProvider',
    );
    if (!already) {
      app.receiver.push({
        $: {
          'android:name': '.nitron.NitronWidgetProvider',
          'android:exported': 'true',
          'android:label': '@string/nitron_widget_label',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
              { $: { 'android:name': TICK_ACTION } },
            ],
          },
        ],
        'meta-data': [
          { $: { 'android:name': 'android.appwidget.provider', 'android:resource': '@xml/nitron_widget_info' } },
        ],
      });
    }

    // Foreground-сервис: проигрывает кадры GIF/видео в виджете.
    const serviceName = '.nitron.NitronLiveService';
    const hasService = app.service.some((s) => s.$ && s.$['android:name'] === serviceName);
    if (!hasService) {
      app.service.push({
        $: {
          'android:name': serviceName,
          'android:exported': 'false',
          'android:foregroundServiceType': 'mediaPlayback',
        },
      });
    }

    return cfg;
  });
}
module.exports = function withAndroidWidget(config) {
  config = withAndroidWidgetSources(config);
  config = withAndroidWidgetManifest(config);
  return config;
};
