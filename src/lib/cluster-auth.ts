import { prisma } from "@/lib/prisma";
import { verifyMessage } from "viem";
import { randomBytes } from "crypto";

const FIVE_MINUTES = 5 * 60 * 1000;
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export type AuthPayload =
  | { sessionToken: string; signature?: never; timestamp?: never }
  | { signature: string; timestamp: number; sessionToken?: never };

/**
 * Verifies ownership of `address` via either:
 * - A valid session token (stored in DB, not expired)
 * - A fresh wallet signature + timestamp (within 5 min)
 *
 * On success with a signature, creates/refreshes the session token and returns it.
 * Returns { ok: true, sessionToken } or { ok: false, error }
 */
export async function verifyClusterAuth(
  address: `0x${string}`,
  payload: AuthPayload
): Promise<{ ok: true; sessionToken: string } | { ok: false; error: string }> {
  // ── Session token path ──
  if (payload.sessionToken) {
    const cluster = await prisma.walletCluster.findFirst({
      where: { address, sessionToken: payload.sessionToken },
      select: { sessionExpiry: true, sessionToken: true },
    });

    if (!cluster || !cluster.sessionToken || !cluster.sessionExpiry) {
      return { ok: false, error: "Invalid session token" };
    }
    if (cluster.sessionExpiry < new Date()) {
      return { ok: false, error: "Session expired — please sign again" };
    }

    return { ok: true, sessionToken: cluster.sessionToken };
  }

  // ── Signature path ──
  const { signature, timestamp } = payload;

  if (!timestamp || Date.now() - timestamp > FIVE_MINUTES) {
    return { ok: false, error: "Signature expired" };
  }

  const message = `MegaStats cluster: ${address} — ${timestamp}`;
  try {
    const valid = await verifyMessage({ address, message, signature: signature as `0x${string}` });
    if (!valid) return { ok: false, error: "Invalid signature" };
  } catch {
    return { ok: false, error: "Signature verification failed" };
  }

  // Create / refresh session token
  const sessionToken = randomBytes(32).toString("hex");
  const sessionExpiry = new Date(Date.now() + SESSION_DURATION);

  await prisma.walletCluster.update({
    where: { address },
    data: { sessionToken, sessionExpiry },
  });

  return { ok: true, sessionToken };
}
