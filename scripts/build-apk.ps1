$ErrorActionPreference = "Stop"

$rootDir = Split-Path -Parent $PSScriptRoot

if (-not $env:JAVA_HOME) {
    if (Test-Path "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot") {
        $env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
    }
}
if (-not $env:ANDROID_HOME) {
    if (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
        $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
    }
}
if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin")) {
    $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
}

Write-Output "==> Checking Java version..."
if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    & "$env:JAVA_HOME\bin\java.exe" -version
} else {
    java -version
}

if (-not (Test-Path "$rootDir\android")) {
    Write-Output "==> Android native project not found. Running expo prebuild..."
    npx expo prebuild --platform android --no-install
}

# Windows MAX_PATH fix for react-native-reanimated CMake/Ninja:
$reanimatedAndroidDir = "$rootDir\node_modules\react-native-reanimated\android"
$reanimatedCommonDir = "$rootDir\node_modules\react-native-reanimated\Common"
$reanimatedJunction = "$reanimatedAndroidDir\Common"
$reanimatedCMake = "$reanimatedAndroidDir\CMakeLists.txt"

if ((Test-Path $reanimatedAndroidDir) -and (Test-Path $reanimatedCommonDir)) {
    if (-not (Test-Path $reanimatedJunction)) {
        Write-Output "==> Setting up Common NTFS junction for react-native-reanimated..."
        New-Item -ItemType Junction -Path $reanimatedJunction -Target $reanimatedCommonDir -Force | Out-Null
    }
    if (Test-Path $reanimatedCMake) {
        $cmakeText = Get-Content $reanimatedCMake -Raw
        if ($cmakeText -match '\$\{CMAKE_SOURCE_DIR\}/\.\./Common') {
            Write-Output "==> Patching react-native-reanimated CMakeLists.txt to prevent Windows MAX_PATH overflow..."
            $cmakeText = $cmakeText.Replace('set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/../Common/cpp")', 'set(COMMON_CPP_DIR "${CMAKE_CURRENT_SOURCE_DIR}/Common/cpp")')
            $cmakeText = $cmakeText.Replace('set(NATIVEVIEW_DIR "${CMAKE_SOURCE_DIR}/../Common/NativeView")', 'set(NATIVEVIEW_DIR "${CMAKE_CURRENT_SOURCE_DIR}/Common/NativeView")')
            $cmakeText = $cmakeText.Replace('"../Common/cpp/reanimated/*.cpp"', '"Common/cpp/reanimated/*.cpp"')
            $cmakeText = $cmakeText.Replace('"../Common/NativeView/react/renderer/components/rnreanimated/*.cpp"', '"Common/NativeView/react/renderer/components/rnreanimated/*.cpp"')
            $cmakeText = $cmakeText.Replace('file(GLOB_RECURSE REANIMATED_COMMON_CPP_SOURCES CONFIGURE_DEPENDS', 'file(GLOB_RECURSE REANIMATED_COMMON_CPP_SOURCES CONFIGURE_DEPENDS RELATIVE "${CMAKE_CURRENT_SOURCE_DIR}"')
            $cmakeText = $cmakeText.Replace('file(GLOB_RECURSE REANIMATED_ANDROID_CPP_SOURCES CONFIGURE_DEPENDS', 'file(GLOB_RECURSE REANIMATED_ANDROID_CPP_SOURCES CONFIGURE_DEPENDS RELATIVE "${CMAKE_CURRENT_SOURCE_DIR}"')
            $cmakeText = $cmakeText.Replace('file(GLOB_RECURSE REANIMATED_NATIVEVIEW_CPP_SOURCES CONFIGURE_DEPENDS', 'file(GLOB_RECURSE REANIMATED_NATIVEVIEW_CPP_SOURCES CONFIGURE_DEPENDS RELATIVE "${CMAKE_CURRENT_SOURCE_DIR}"')
            Set-Content -Path $reanimatedCMake -Value $cmakeText -NoNewline
        }
    }
}

Set-Location -Path "$rootDir\android"
Write-Output "==> Building Release APK via Gradle..."
.\gradlew.bat assembleRelease --no-daemon --console=plain

$apkPath = "$rootDir\android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    $destApk = "$rootDir\TrackYourMovement.apk"
    Copy-Item -Path $apkPath -Destination $destApk -Force
    Write-Output "==> SUCCESS! Standalone Release APK generated successfully:"
    Write-Output "    File: $destApk"
    Get-Item $destApk | Select-Object Name, Length, LastWriteTime
} else {
    Write-Warning "APK not found at $apkPath"
}
