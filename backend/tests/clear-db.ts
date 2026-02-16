/**
 * Clear persistent test database
 */

import { clearTestDatabase, getTestDatabaseInfo } from "./persistent-db.js"

console.log("Clearing persistent test database...")

const info = getTestDatabaseInfo()
if (info) {
  console.log(`Current database: ${info.users} users, ${info.transactions} transactions`)
}

clearTestDatabase()

console.log("✓ Test database cleared")
