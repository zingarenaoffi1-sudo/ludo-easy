import os
import re
import shutil

def configure_gradle_release():
    root_gradle = "android/build.gradle"
    if os.path.exists(root_gradle):
        with open(root_gradle, "r", encoding="utf-8") as f:
            root = f.read()
        if "com.google.gms:google-services" not in root:
            root = root.replace("dependencies {", "dependencies {\n        classpath \"com.google.gms:google-services:4.4.2\"")
        with open(root_gradle, "w", encoding="utf-8") as f:
            f.write(root)

    app_gradle = "android/app/build.gradle"
    if os.path.exists(app_gradle):
        with open(app_gradle, "r", encoding="utf-8") as f:
            app = f.read()

        # Remove any unity ads remnants
        app = re.sub(r'implementation\s+["\']com\.unity3d\.ads:unity-ads:[^"\']+["\']', '', app)

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
    print("Gradle and release signing configured successfully via prepare-android.py")

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

    configure_gradle_release()

if __name__ == "__main__":
    main()
