import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs"
import { extname, join } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"
import type { RouteContext } from "../route-context.js"
import { id } from "../utils/id.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const UPLOADS_DIR = join(__dirname, "../../uploads")

// Create uploads directory if it doesn't exist
try {
  mkdirSync(UPLOADS_DIR, { recursive: true })
} catch (e) {
  // Directory may already exist
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
}

export async function registerUploadsRoutes({ app }: RouteContext) {
  // Serve uploaded images
  app.get<{ Params: { filename: string } }>("/uploads/:filename", async (request, reply) => {
    const filename = request.params.filename
    const filepath = join(UPLOADS_DIR, filename)

    // Validate filename to prevent directory traversal
    if (filename.includes("..") || !filename.match(/^[a-zA-Z0-9\-_.]+$/)) {
      return reply.code(400).send({ error: "Invalid filename" })
    }

    if (!existsSync(filepath)) {
      return reply.code(404).send({ error: "File not found" })
    }

    try {
      const fileContent = readFileSync(filepath)
      const mimeType = MIME_TYPES[extname(filename)] || "application/octet-stream"
      reply.type(mimeType).send(fileContent)
    } catch (error) {
      console.error("File serve failed:", error)
      return reply.code(500).send({ error: "Failed to serve file" })
    }
  })

  // Upload image
  app.post<{ Body: any }>("/uploads/image", async (request, reply) => {
    const { fileName, mimeType, contentBase64 } = request.body as any

    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return reply.code(400).send({ error: "Invalid MIME type" })
    }

    if (!contentBase64) {
      return reply.code(400).send({ error: "No image content provided" })
    }

    try {
      // Get file extension from MIME type
      const ext =
        mimeType === "image/jpeg"
          ? ".jpg"
          : mimeType === "image/png"
            ? ".png"
            : mimeType === "image/webp"
              ? ".webp"
              : mimeType === "image/gif"
                ? ".gif"
                : ".avif"

      const fileId = id("img")
      const filename = `${fileId}${ext}`
      const filepath = join(UPLOADS_DIR, filename)

      // Convert base64 to buffer
      const buffer = Buffer.from(contentBase64, "base64")

      // Check file size (max 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.code(400).send({ error: "File is too large" })
      }

      // Write file
      writeFileSync(filepath, buffer)

      // Return relative URL
      const url = `/uploads/${filename}`

      return { success: true, url }
    } catch (error) {
      console.error("Image upload failed:", error)
      return reply.code(500).send({ error: "Upload failed" })
    }
  })
}
