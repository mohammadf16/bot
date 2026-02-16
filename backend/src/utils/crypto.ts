import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

export function randomHex(bytes = 32): string {
  return randomBytes(bytes).toString("hex")
}

export function hmacSha256Hex(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex")
}

export function hashToken(token: string): string {
  return sha256Hex(token)
}

export function secureEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8")
  const bBuf = Buffer.from(b, "utf8")
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

function normalizeKey(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest()
}

export function encryptText(plain: string, secret: string): string {
  const key = normalizeKey(secret)
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("hex")}.${tag.toString("hex")}.${encrypted.toString("hex")}`
}

export function decryptText(payload: string, secret: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(".")
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Invalid encrypted payload")
  }
  const key = normalizeKey(secret)
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"))
  decipher.setAuthTag(Buffer.from(tagHex, "hex"))
  const plain = Buffer.concat([decipher.update(Buffer.from(dataHex, "hex")), decipher.final()])
  return plain.toString("utf8")
}
