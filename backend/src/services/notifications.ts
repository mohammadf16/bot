import type { AppStore } from "../store/app-store.js"
import { id } from "../utils/id.js"
import { nowIso } from "../utils/time.js"

export function pushUserNotification(
  store: AppStore,
  input: {
    userId: string
    title: string
    body?: string
    kind?: "info" | "success" | "warning"
  },
): void {
  const item = {
    id: id("ntf"),
    userId: input.userId,
    title: input.title,
    body: input.body,
    kind: input.kind ?? "info",
    createdAt: nowIso(),
  }
  store.notifications.set(item.id, item)
}

