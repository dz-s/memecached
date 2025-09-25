import { writeFileSync, readFileSync } from "fs";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const key = randomBytes(32);

function encryptMapSnapshot(cacheMap: Map<string, string>): { data: Uint8Array; iv: Uint8Array } {
  const mapArray = Array.from(cacheMap.entries());
  const snapshotStr = JSON.stringify(mapArray);

  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(snapshotStr, "utf8"), cipher.final()]);

  return { data: new Uint8Array(encrypted), iv };
}

function decryptMapSnapshot(encryptedData: Uint8Array, iv: Uint8Array): Map<string, string> {
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  const mapArray: [string, string][] = JSON.parse(decrypted.toString("utf8"));
  return new Map(mapArray);
}

export function saveEncryptedCacheToFile(filePath: string, cacheMap: Map<string, string>) {
    const { data, iv } = encryptMapSnapshot(cacheMap);
    const fileContent = Buffer.concat([iv, Buffer.from(data)]);
    writeFileSync(filePath, fileContent);
}

export function loadEncryptedCacheFromFile(filePath: string): Map<string, string> {
    const fileContent = readFileSync(filePath);
    const iv = fileContent.subarray(0, 16);
    const encryptedData = fileContent.subarray(16);
    return decryptMapSnapshot(encryptedData, iv);
}
