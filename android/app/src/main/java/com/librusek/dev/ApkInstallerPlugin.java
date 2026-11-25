package com.librusek.dev;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Downloads a release APK from GitHub and hands it to the system package installer.
 *
 * JS: `ApkInstaller.install({url, size})` -> resolves once the installer is opened (the outcome can't be observed),
 * emits `progress` events `{percent}` while downloading. Only release assets of the app's own repository are accepted,
 * and the downloaded file must be this app's package with a higher versionCode - Android checks the signature itself.
 */
@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    // Same repository as REPOSITORY in src/lib/updater.ts and UPDATER_REPOSITORY in .github/workflows/release.yml
    private static final String ALLOWED_PREFIX = "https://github.com/SimonB50/librusek/releases/download/";
    private static final String FILE_NAME = "update.apk";

    private volatile boolean busy = false;

    @PluginMethod
    public void install(PluginCall call) {
        String url = call.getString("url");
        // Not call.getLong(): JS numbers below 2^31 arrive as Integer and getLong() only accepts Long
        long size = call.getData().optLong("size", -1L);
        if (url == null || !url.startsWith(ALLOWED_PREFIX) || !url.endsWith(".apk")) {
            call.reject("Not a release APK of the app", "INVALID_URL");
            return;
        }
        if (busy) {
            call.reject("An update is already being downloaded", "BUSY");
            return;
        }
        busy = true;
        new Thread(() -> {
            try {
                File apk = new File(new File(getContext().getCacheDir(), "updates"), FILE_NAME);
                if (!(apk.isFile() && apk.length() == size && isNewerOwnPackage(apk))) {
                    download(url, size, apk);
                }
                if (size > 0 && apk.length() != size) {
                    throw new InstallException("SIZE_MISMATCH", "Downloaded file has a wrong size");
                }
                if (!isNewerOwnPackage(apk)) {
                    apk.delete();
                    throw new InstallException("INVALID_PACKAGE", "Downloaded file is not a newer version of the app");
                }
                try {
                    openInstaller(apk);
                } catch (ActivityNotFoundException error) {
                    throw new InstallException("NO_INSTALLER", "No package installer available");
                }
                call.resolve();
            } catch (InstallException error) {
                call.reject(error.getMessage(), error.code);
            } catch (Exception error) {
                call.reject(error.getMessage() != null ? error.getMessage() : "Update failed", "DOWNLOAD_FAILED", error);
            } finally {
                busy = false;
            }
        }).start();
    }

    private void download(String address, long expectedSize, File target) throws IOException {
        File directory = target.getParentFile();
        if (directory != null && !directory.isDirectory() && !directory.mkdirs()) {
            throw new IOException("Cannot create " + directory);
        }
        File partial = new File(directory, FILE_NAME + ".part");
        HttpURLConnection connection = (HttpURLConnection) new URL(address).openConnection();
        // github.com redirects (https -> https) to its release asset storage
        connection.setInstanceFollowRedirects(true);
        connection.setConnectTimeout(15_000);
        connection.setReadTimeout(30_000);
        try {
            int status = connection.getResponseCode();
            if (status != HttpURLConnection.HTTP_OK) throw new IOException("HTTP " + status);
            long total = connection.getContentLengthLong() > 0 ? connection.getContentLengthLong() : expectedSize;
            try (InputStream input = connection.getInputStream(); OutputStream output = new FileOutputStream(partial)) {
                byte[] buffer = new byte[64 * 1024];
                long done = 0;
                int lastPercent = -1;
                int read;
                while ((read = input.read(buffer)) != -1) {
                    output.write(buffer, 0, read);
                    done += read;
                    if (total > 0) {
                        int percent = (int) Math.min(100, done * 100 / total);
                        if (percent != lastPercent) {
                            lastPercent = percent;
                            JSObject event = new JSObject();
                            event.put("percent", percent);
                            notifyListeners("progress", event);
                        }
                    }
                }
            }
        } finally {
            connection.disconnect();
        }
        if (target.exists() && !target.delete()) throw new IOException("Cannot replace " + target);
        if (!partial.renameTo(target)) throw new IOException("Cannot move " + partial);
    }

    @SuppressWarnings("deprecation")
    private boolean isNewerOwnPackage(File apk) {
        try {
            PackageManager manager = getContext().getPackageManager();
            PackageInfo archive = manager.getPackageArchiveInfo(apk.getAbsolutePath(), 0);
            PackageInfo installed = manager.getPackageInfo(getContext().getPackageName(), 0);
            if (archive == null || !getContext().getPackageName().equals(archive.packageName)) return false;
            long archiveCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? archive.getLongVersionCode() : archive.versionCode;
            long installedCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ? installed.getLongVersionCode() : installed.versionCode;
            return archiveCode > installedCode;
        } catch (PackageManager.NameNotFoundException error) {
            return false;
        }
    }

    private void openInstaller(File apk) {
        Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
        Intent intent = new Intent(Intent.ACTION_VIEW)
                .setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        // Android 8+ asks the user to allow installs from this app the first time (REQUEST_INSTALL_PACKAGES)
        getContext().startActivity(intent);
    }

    private static class InstallException extends Exception {
        final String code;

        InstallException(String code, String message) {
            super(message);
            this.code = code;
        }
    }
}
