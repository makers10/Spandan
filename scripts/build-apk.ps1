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
