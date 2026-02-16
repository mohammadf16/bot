# Test Suite Documentation

## Overview

This comprehensive test suite creates 100 test users with varying odds/chances, performs multiple game spins, records all transactions, and validates database integrity.

## What It Does

### 1. **Test User Creation** ✓
- Creates 100 test users with realistic data
- Distributes chances varied across: 10, 20, 50, 100, 200, 500
- Assigns random wallet balances (1M - 11M Rials)
- Creates unique referral codes and email addresses
- All data is indexed in the in-memory store

### 2. **Game Simulations** ✓
- Each user performs 5 wheel spins
- Implements weighted random selection (based on segment weights)
- Simulates wins with 30% probability
- Updates user wallet balances and chances accordingly
- Records detailed spin records with timestamps

### 3. **Financial Transactions** ✓
- Creates 1-3 wallet transactions per user
- Transaction types: deposit, ticket_purchase, cashback
- Records in wallet transaction log
- Total transactions tracked and reported

### 4. **Audit Logging** ✓
- Creates 100+ audit log entries
- Actions tracked: user_created, spin_performed, wallet_updated, chances_adjusted
- 95% success rate simulation
- All logs timestamped and indexed

### 5. **Data Validation** ✓
- Verifies all users exist in store
- Checks spins reference valid users
- Validates non-negative chances and balances
- Ensures unique emails and referral codes
- Confirms data consistency

## Quick Start

### In-Memory Testing (Default)

```bash
# Install dependencies
npm install

# Run with default settings (100 users, 5 spins per user)
npx tsx tests/test-runner.ts

# Export results to JSON
npx tsx tests/test-runner.ts --export my-test-results.json

# Custom configuration
npx tsx tests/test-runner.ts --users 50 --spins 10 --prefix custom_
```

### With MySQL Database (Optional)

First, install MySQL driver:
```bash
npm install mysql2
```

Then use the database integration module (requires active MySQL database):

```bash
# The test runner will automatically detect MySQL configuration via environment variables:
#   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

DB_HOST=localhost DB_PORT=3306 DB_USER=root DB_PASSWORD=secret DB_NAME=car_lottery \
  npx tsx tests/test-runner-db.ts --users 100 --spins 5
```

## Command Line Options

```
--users N          Number of test users to create (default: 100)
--spins N          Number of spins per user (default: 5)
--prefix STRING    Prefix for test data (default: "test_")
--export FILE      Export results to JSON file (default: test-results-[timestamp].json)
--db               Enable MySQL database persistence (if configured)
--cleanup          Clean up test data from database before/after
```

## Output Report

The test runner generates a detailed report:

```
╔════════════════════════════════════════════════════════════════╗
║                       TEST REPORT                              ║
╚════════════════════════════════════════════════════════════════╝

Test Configuration:
  - Test Users: 100
  - Spins per User: 5
  - Test Prefix: test_

Statistics:
  - Users Created: 100
  - Total Spins: 500
  - Wallet Transactions: 234
  - Total Wallet Value: 1,234.56M Rials
  - Audit Logs: 100

Spin Distribution:
  - ۵۰ میلیون: 95
  - ۵ میلیون: 75
  - شانس اضافه: 125
  - ۱۰ میلیون: 75
  - طلای آب شده: 48
  - پوچ: 82

Validation:
  - Status: ✓ PASSED
  - Errors: 0
  - Warnings: 0
```

## JSON Export Format

When using `--export`, results are saved as:

```json
{
  "metadata": {
    "executedAt": "2026-02-14T10:30:00.000Z",
    "nodeVersion": "v20.10.0",
    "platform": "win32"
  },
  "testReport": {
    "testRunId": "a1b2c3d4e5f6g7h8",
    "createdAt": "2026-02-14T10:30:00.000Z",
    "config": {
      "testUserCount": 100,
      "spinsPerUser": 5,
      "testPrefix": "test_"
    },
    "stats": {
      "usersCreated": 100,
      "totalSpinsPerformed": 500,
      "spinsBySegment": {
        "۵۰ میلیون": 95,
        "۵ میلیون": 75,
        "شانس اضافه": 125,
        "۱۰ میلیون": 75,
        "طلای آب شده": 48,
        "پوچ": 82
      },
      "walletTransactions": 234,
      "totalWalletValue": 1234560000,
      "auditLogsCreated": 100
    },
    "validation": {
      "passed": true,
      "errors": [],
      "warnings": []
    }
  },
  "storeSnapshot": {
    "usersCount": 100,
    "wheelSpinsCount": 500,
    "walletTransactionsCount": 234,
    "auditLogsCount": 100,
    "rafflesCount": 1
  }
}
```

## Test Data Details

### User Distribution by Chances

| Chances | Users | Purpose |
|---------|-------|---------|
| 10      | 16    | Low engagement |
| 20      | 17    | Economic players |
| 50      | 17    | Regular players |
| 100     | 17    | Active players |
| 200     | 17    | Engaged players |
| 500     | 16    | VIP players |

### Wallet Balance Distribution

- Random: 1,000,000 - 11,000,000 Rials
- Average: ~6,000,000 Rials
- Total Collective: ~600,000,000 Rials

## Validation Checks

The test suite performs the following validation checks:

1. ✓ All test users exist in store
2. ✓ All test users indexed by email
3. ✓ All spins reference valid users
4. ✓ No negative chances values
5. ✓ No negative wallet balances (warnings only)
6. ✓ No duplicate referral codes
7. ✓ No duplicate email addresses
8. ✓ Transaction integrity
9. ✓ Audit log completeness

## Example Usage

### Scenario 1: Basic Test
```bash
npx tsx tests/test-runner.ts
```

### Scenario 2: Larger Test with Export
```bash
npx tsx tests/test-runner.ts --users 500 --spins 10 --export large-test.json
```

### Scenario 3: Stress Test
```bash
npx tsx tests/test-runner.ts --users 1000 --spins 20 --prefix stress_test_
```

### Scenario 4: Database Integration
```bash
# First, ensure your .env has database credentials
npx tsx tests/test-runner.ts --db --cleanup --users 100 --export db-test.json
```

## Interpreting Results

### ✓ PASSED
All validation checks passed. Data is consistent and valid.

### ✗ FAILED
One or more validation checks failed. Review error messages in the report.

### ⚠ WARNINGS
Non-critical issues found (e.g., negative balances). Review warnings but tests may still be usable.

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Test Suite
  run: |
    cd backend
    npx tsx tests/test-runner.ts \
      --users 100 \
      --spins 5 \
      --export test-results.json

- name: Check Test Results
  run: |
    if grep -q '"passed": false' test-results.json; then
      echo "Tests failed!"
      exit 1
    fi
```

## Troubleshooting

### Error: "Cannot find module"
Ensure you've run `npm install` in the backend directory.

### Error: "Wheel config segments not initialized"
Bootstrap is not running properly. Check the Logger output.

### Error: "mysql2 not installed"
To use database integration, install: `npm install mysql2`

### Slow Execution
For 100 users with 5 spins each:
- Expected: ~2-5 seconds
- If slower: Check system resources or disable logs with `--silent`

## Files Generated

- `test-results-[timestamp].json` - Full test report (if exported)
- `console output` - Real-time test execution logs

## Performance Metrics

For reference (1000 tests, Intel i7, 16GB RAM):

| Operation | Time |
|-----------|------|
| Create 100 users | ~500ms |
| Perform 500 spins | ~800ms |
| Create 300 transactions | ~200ms |
| Validation | ~100ms |
| **Total** | **~1.6s** |

## Data Cleanup

The generated test data includes the prefix "test_" in all user emails by default.

To remove test data (if using MySQL):
```sql
DELETE FROM users WHERE email LIKE 'test_%';
DELETE FROM wallet_transactions WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'test_%'
);
```

## Additional Resources

- Test Module: `test-data-generator.ts`
- Database Integration: `database-integration.ts`
- Test Runner: `test-runner.ts`
- Schema: `../sql/schema.mysql.sql`

## Support

For issues or questions about the test suite:
1. Check the console output for error messages
2. Review `test-results-[timestamp].json` for detailed information
3. Ensure all dependencies are installed: `npm install`
4. Check database configuration if using `--db` flag
