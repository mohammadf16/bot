import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createProvablyFairProof, verifyProof } from "../src/security/lottery.js";
function sha256Hex(value) {
    return createHash("sha256").update(value, "utf8").digest("hex");
}
test("proof generation is deterministic and verifiable", () => {
    const tickets = Array.from({ length: 50 }, (_, i) => ({
        id: `t${i + 1}`,
        raffleId: "raf_1",
        userId: `u_${(i % 5) + 1}`,
        index: i + 1,
        pricePaid: 1_000_000,
        clientSeed: `client-seed-${i + 1}`,
        createdAt: new Date().toISOString(),
    }));
    const serverSeed = "abc123serverseedXYZ987";
    const proof1 = createProvablyFairProof({
        raffleId: "raf_1",
        seedCommitHash: sha256Hex(serverSeed),
        serverSeed,
        externalEntropy: "drand-round-283726:hex-output",
        closedAt: "2026-02-13T12:00:00.000Z",
        tickets,
        winnerCount: 3,
    });
    const proof2 = createProvablyFairProof({
        raffleId: "raf_1",
        seedCommitHash: sha256Hex(serverSeed),
        serverSeed,
        externalEntropy: "drand-round-283726:hex-output",
        closedAt: "2026-02-13T12:00:00.000Z",
        tickets,
        winnerCount: 3,
    });
    assert.deepEqual(proof1.winnerTicketIndexes, proof2.winnerTicketIndexes);
    assert.equal(verifyProof(proof1, tickets, "2026-02-13T12:00:00.000Z"), true);
});
