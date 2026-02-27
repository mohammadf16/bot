import { existsSync, mkdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.resolve(__dirname, process.env.UPLOADS_DIR || "uploads")
mkdirSync(uploadsDir, { recursive: true })

const distEntry = path.resolve(__dirname, "dist/index.js")
if (!existsSync(distEntry)) {
  console.error("[cpanel] dist/index.js not found. Run: npm run build")
  process.exit(1)
}

await import(pathToFileURL(distEntry).href)
