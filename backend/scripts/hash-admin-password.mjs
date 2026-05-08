import argon2 from "argon2"
import { randomBytes } from "node:crypto"
import { stdin as input, stdout as output } from "node:process"
import { createInterface } from "node:readline/promises"

function generatePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+="
  const bytes = randomBytes(28)
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")
}

const rl = createInterface({ input, output })
const provided = process.argv.slice(2).join(" ").trim()
const password = provided || (await rl.question("Admin password (leave empty to generate): "))
rl.close()

const finalPassword = password.trim() || generatePassword()
const hash = await argon2.hash(finalPassword, { type: argon2.argon2id })

console.log("")
console.log("BOOTSTRAP_ADMIN_PASSWORD_HASH=" + hash)
if (!provided && !password.trim()) {
  console.log("Generated admin password: " + finalPassword)
}
console.log("")
console.log("Keep the password in your password manager. Do not commit it.")
