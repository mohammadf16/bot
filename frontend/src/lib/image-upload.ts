"use client"

import { apiRequest } from "./api"

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("IMAGE_READ_FAILED"))
    reader.readAsDataURL(file)
  })
}

export async function uploadUserImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("INVALID_IMAGE_TYPE")
  const contentBase64 = await toDataUrl(file)
  const payload = await apiRequest<{ url: string }>("/uploads/image", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      contentBase64,
    }),
  })
  return payload.url
}
