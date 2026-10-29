import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read apps/web/.env
const envPath = path.resolve(__dirname, "../apps/web/.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const bucket = process.env.NEON_STORAGE_BUCKET || "assets";
const endpoint = process.env.AWS_ENDPOINT_URL_S3 || process.env.NEON_S3_ENDPOINT || undefined;
const region = process.env.AWS_REGION || "us-east-1";

console.log(`Configuring S3 Client:`);
console.log(`- Bucket: ${bucket}`);
console.log(`- Endpoint: ${endpoint || "default"}`);
console.log(`- Region: ${region}`);
console.log(`- Access Key set: ${!!process.env.AWS_ACCESS_KEY_ID}`);

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.log("\n[WARNING] AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY is empty in apps/web/.env.");
  console.log("Please fill them in apps/web/.env and re-run this script.");
  process.exit(1);
}

const s3Config = {
  forcePathStyle: true,
  region,
};
if (endpoint) {
  s3Config.endpoint = endpoint;
}

const s3 = new S3Client(s3Config);

const mimeMap = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif",
};

async function uploadFolder(dirPath, prefix = "") {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath);

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await uploadFolder(fullPath, `${prefix}${entry}/`);
    } else if (stat.isFile()) {
      const ext = path.extname(entry).replace(".", "").toLowerCase();
      const contentType = mimeMap[ext] || "application/octet-stream";
      const fileBuffer = fs.readFileSync(fullPath);
      const key = `${prefix}${entry}`;

      console.log(`Uploading ${key} (${fileBuffer.length} bytes)...`);
      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
          })
        );
        console.log(`  -> Successfully uploaded: ${key}`);
      } catch (err) {
        console.error(`  -> Failed to upload ${key}:`, err.message);
      }
    }
  }
}

async function main() {
  const imagesDir = path.resolve(__dirname, "../apps/web/public/images");
  const logoPath = path.resolve(__dirname, "../apps/web/public/logo.png");

  console.log("\nStarting sync to Neon S3 storage bucket...\n");
  await uploadFolder(imagesDir, "images/");

  if (fs.existsSync(logoPath)) {
    const fileBuffer = fs.readFileSync(logoPath);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: "logo.png",
        Body: fileBuffer,
        ContentType: "image/png",
      })
    );
    console.log("  -> Successfully uploaded: logo.png");
  }

  console.log("\nSync to Neon storage bucket complete!");
}

main().catch((err) => {
  console.error("Upload script error:", err);
  process.exit(1);
});

