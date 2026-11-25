import {Capacitor} from "@capacitor/core";
import {Directory, Filesystem} from "@capacitor/filesystem";
import {Share} from "@capacitor/share";

const toBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve((reader.result as string).split(",", 2)[1] ?? "");
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

/**
 * Hands a downloaded file to the user.
 * - web: regular browser download
 * - native: written to the app cache and opened in the system share sheet ("Open with…", save to Files, send…)
 */
const saveFile = async (blob: Blob, filename: string) => {
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    return;
  }
  const {uri} = await Filesystem.writeFile({
    path: filename,
    data: await toBase64(blob),
    directory: Directory.Cache,
    recursive: true,
  });
  await Share.share({title: filename, files: [uri]});
};

export {saveFile};
