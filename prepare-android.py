import os
import re
import json

def sanitize_capacitor_plugins():
    # Sanitize capacitor.settings.gradle
    settings_path = "android/capacitor.settings.gradle"
    if os.path.exists(settings_path):
        with open(settings_path, "r", encoding="utf-8") as f:
            settings = f.read()
        settings = re.sub(r"include ':capacitor-firebase-[^']+'\s*", "", settings)
        settings = re.sub(r"project\(':capacitor-firebase-[^']+'\)\.projectDir\s*=\s*[^\n]+\s*", "", settings)
        if "include ':capacitor-app'" not in settings and os.path.exists("node_modules/@capacitor/app"):
            settings += "\ninclude ':capacitor-app'\nproject(':capacitor-app').projectDir = new File('../node_modules/@capacitor/app/android')\n"
        with open(settings_path, "w", encoding="utf-8") as f:
            f.write(settings)

    # Sanitize capacitor.build.gradle
    cap_build_path = "android/app/capacitor.build.gradle"
    if os.path.exists(cap_build_path):
        with open(cap_build_path, "r", encoding="utf-8") as f:
            cap_build = f.read()
        cap_build = re.sub(r"implementation project\(':capacitor-firebase-[^']+'\)\s*", "", cap_build)
        with open(cap_build_path, "w", encoding="utf-8") as f:
            f.write(cap_build)

    # Sanitize capacitor.plugins.json in assets
    assets_plugins_path = "android/app/src/main/assets/capacitor.plugins.json"
    if os.path.exists(assets_plugins_path):
        try:
            with open(assets_plugins_path, "r", encoding="utf-8") as f:
                plugins = json.load(f)
            plugins = [p for p in plugins if "firebase" not in p.get("pkg", "").lower()]
            with open(assets_plugins_path, "w", encoding="utf-8") as f:
                json.dump(plugins, f, indent=2)
        except Exception:
            pass

    # Sanitize capacitor.config.json in assets
    assets_config_path = "android/app/src/main/assets/capacitor.config.json"
    if os.path.exists(assets_config_path):
        try:
            with open(assets_config_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            if "plugins" in cfg and "FirebaseAuthentication" in cfg["plugins"]:
                del cfg["plugins"]["FirebaseAuthentication"]
            with open(assets_config_path, "w", encoding="utf-8") as f:
                json.dump(cfg, f, indent=2)
        except Exception:
            pass

def configure_gradle_release():
    root_gradle = "android/build.gradle"
    if os.path.exists(root_gradle):
        with open(root_gradle, "r", encoding="utf-8") as f:
            root = f.read()
        # Remove any google-services classpath
        root = re.sub(r'classpath\s+["\']com\.google\.gms:google-services:[^"\']+["\']\s*', '', root)
        with open(root_gradle, "w", encoding="utf-8") as f:
            f.write(root)

    app_gradle = "android/app/build.gradle"
    if os.path.exists(app_gradle):
        with open(app_gradle, "r", encoding="utf-8") as f:
            app = f.read()

        # Remove any unity ads or firebase remnants
        app = re.sub(r'implementation\s+["\']com\.unity3d\.ads:unity-ads:[^"\']+["\']', '', app)
        app = re.sub(r"apply plugin:\s+['\"]com\.google\.gms\.google-services['\"]\s*", '', app)
        app = re.sub(r"try\s*\{\s*def servicesJSON = file\('google-services\.json'\)[\s\S]*?\}\s*catch\(Exception e\)\s*\{[\s\S]*?\}", '', app)

        if "mavenCentral()" not in app:
            app = app.replace("repositories {", "repositories {\n    mavenCentral()\n    google()")

        k_pass = (os.environ.get("KEYSTORE_PASSWORD") or "").strip() or "android"
        k_alias = (os.environ.get("KEY_ALIAS") or "").strip() or "androiddebugkey"
        k_keypass = (os.environ.get("KEY_PASSWORD") or "").strip() or "android"

        if "signingConfigs {" in app:
            app = re.sub(r'storeFile file\([^)]+\)', 'storeFile file("debug.keystore")', app)
            app = re.sub(r'storePassword "[^"]+"', f'storePassword "{k_pass}"', app)
            app = re.sub(r'keyAlias "[^"]+"', f'keyAlias "{k_alias}"', app)
            app = re.sub(r'keyPassword "[^"]+"', f'keyPassword "{k_keypass}"', app)
        else:
            signing_cfg = f"""
android {{
    signingConfigs {{
        release {{
            storeFile file("debug.keystore")
            storePassword "{k_pass}"
            keyAlias "{k_alias}"
            keyPassword "{k_keypass}"
        }}
    }}
    buildTypes {{
        release {{
            signingConfig signingConfigs.release
            minifyEnabled false
            shrinkResources false
        }}
    }}
}}
"""
            app += signing_cfg
        with open(app_gradle, "w", encoding="utf-8") as f:
            f.write(app)
    print("Gradle and release signing configured successfully (100% offline, zero Firebase).")

def main():
    manifest_path = "android/app/src/main/AndroidManifest.xml"
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Strip any old AdMob/Ads metadata if present
        content = re.sub(r'<meta-data\s+android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"[^>]*/>', '', content)
        content = re.sub(r'<meta-data\s+android:name="com\.google\.android\.gms\.ads\.DELAY_APP_MEASUREMENT_INIT"[^>]*/>', '', content)
        content = re.sub(r'<uses-permission android:name="android\.permission\.RECORD_AUDIO"[^/]*/>', '', content)
        content = re.sub(r'<uses-permission android:name="android\.permission\.MODIFY_AUDIO_SETTINGS"[^/]*/>', '', content)
        content = re.sub(r'<uses-permission android:name="com\.google\.android\.gms\.permission\.AD_ID"[^/]*/>', '', content)

        if "android.permission.INTERNET" not in content:
            content = content.replace("<application", '\n    <uses-permission android:name="android.permission.INTERNET"/>\n    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>\n    <application')

        with open(manifest_path, "w", encoding="utf-8") as f:
            f.write(content)

    strings_path = "android/app/src/main/res/values/strings.xml"
    if os.path.exists(strings_path):
        with open(strings_path, "r", encoding="utf-8") as f:
            strings_xml = f.read()
        strings_xml = re.sub(r'<string name="app_name">[^<]*</string>', '<string name="app_name">Ludo</string>', strings_xml)
        strings_xml = re.sub(r'<string name="title_activity_main">[^<]*</string>', '<string name="title_activity_main">Ludo</string>', strings_xml)
        with open(strings_path, "w", encoding="utf-8") as f:
            f.write(strings_xml)

    pkg_dir = "android/app/src/main/java/com/zingarena/app"
    os.makedirs(pkg_dir, exist_ok=True)

    unity_plugin = os.path.join(pkg_dir, "UnityAdsPlugin.java")
    if os.path.exists(unity_plugin):
        try:
            os.remove(unity_plugin)
        except Exception:
            pass

    main_act_path = os.path.join(pkg_dir, "MainActivity.java")
    main_act_content = """package com.zingarena.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
}
"""
    with open(main_act_path, "w", encoding="utf-8") as f:
        f.write(main_act_content)

    vars_path = "android/variables.gradle"
    if os.path.exists(vars_path):
        with open(vars_path, "r", encoding="utf-8") as f:
            vars_content = f.read()
        if "rgcfaIncludeGoogle" not in vars_content:
            vars_content = vars_content.replace("ext {", "ext {\n    rgcfaIncludeGoogle = false\n    rgcfaIncludeFacebook = false")
            with open(vars_path, "w", encoding="utf-8") as f:
                f.write(vars_content)

    sanitize_capacitor_plugins()
    configure_gradle_release()

if __name__ == "__main__":
    main()
