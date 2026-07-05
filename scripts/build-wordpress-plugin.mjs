import { execSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const pluginDir = path.join(root, "integrations", "wordpress-plugin", "anselio");
const outDir = path.join(root, "public", "downloads");
const outFile = path.join(outDir, "anselio-wordpress.zip");

await mkdir(outDir, { recursive: true });

if (process.platform === "win32") {
  const src = pluginDir.replace(/'/g, "''");
  const dest = outFile.replace(/'/g, "''");
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${src}' -DestinationPath '${dest}' -Force"`,
    { stdio: "inherit" },
  );
} else {
  execSync(`zip -r "${outFile}" anselio`, {
    cwd: path.join(root, "integrations", "wordpress-plugin"),
    stdio: "inherit",
  });
}

console.log(`Wrote ${outFile}`);
