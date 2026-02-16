/**
 * Persistent Test Data Module
 * Saves test data to JSON file for persistence across restarts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "..", "test-database.json");
/**
 * Load test data from JSON file
 */
export function loadTestDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, "utf-8");
            return JSON.parse(data);
        }
    }
    catch (error) {
        console.warn("Failed to load test database:", error);
    }
    return null;
}
/**
 * Save test data to JSON file
 */
export function saveTestDatabase(db) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        console.log(`✓ Test database saved to: ${DB_FILE}`);
    }
    catch (error) {
        console.error("Failed to save test database:", error);
        throw error;
    }
}
/**
 * Convert AppStore data to persistent format
 */
export function exportStoreToDatabase(users, transactions, spins, auditLogs) {
    return {
        users,
        transactions,
        spins,
        auditLogs,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
/**
 * Clear test database
 */
export function clearTestDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            fs.unlinkSync(DB_FILE);
            console.log(`✓ Test database cleared`);
        }
    }
    catch (error) {
        console.error("Failed to clear test database:", error);
    }
}
/**
 * Get test database file path for inspection
 */
export function getTestDatabasePath() {
    return DB_FILE;
}
/**
 * Get database size info
 */
export function getTestDatabaseInfo() {
    try {
        const db = loadTestDatabase();
        if (!db)
            return null;
        const stats = fs.statSync(DB_FILE);
        return {
            path: DB_FILE,
            size: `${(stats.size / 1024).toFixed(2)} KB`,
            users: db.users.length,
            transactions: db.transactions.length,
            spins: db.spins.length,
            auditLogs: db.auditLogs.length,
            createdAt: db.createdAt,
            updatedAt: db.updatedAt,
        };
    }
    catch (error) {
        return null;
    }
}
