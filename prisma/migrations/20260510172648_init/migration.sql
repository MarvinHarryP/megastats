-- CreateTable
CREATE TABLE "wallet_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lastFetchedAt" DATETIME NOT NULL,
    "fetchedThrough" INTEGER NOT NULL DEFAULT 0,
    "txCount" INTEGER NOT NULL DEFAULT 0,
    "txCountSent" INTEGER NOT NULL DEFAULT 0,
    "txCountReceived" INTEGER NOT NULL DEFAULT 0,
    "txCountContract" INTEGER NOT NULL DEFAULT 0,
    "feesWei" TEXT NOT NULL DEFAULT '0',
    "volumeInWei" TEXT NOT NULL DEFAULT '0',
    "volumeOutWei" TEXT NOT NULL DEFAULT '0',
    "activeDays" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "firstTxAt" DATETIME,
    "lastTxAt" DATETIME
);

-- CreateTable
CREATE TABLE "cached_transaction" (
    "hash" TEXT NOT NULL PRIMARY KEY,
    "walletId" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT,
    "value" TEXT NOT NULL,
    "gasUsed" TEXT NOT NULL,
    "gasPrice" TEXT NOT NULL,
    "feeWei" TEXT NOT NULL,
    "txType" TEXT NOT NULL,
    "isError" BOOLEAN NOT NULL DEFAULT false,
    "methodId" TEXT,
    "contractName" TEXT,
    CONSTRAINT "cached_transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallet_cache" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_activity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "walletId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "txCount" INTEGER NOT NULL,
    "feesWei" TEXT NOT NULL,
    "volumeWei" TEXT NOT NULL,
    CONSTRAINT "daily_activity_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallet_cache" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "cached_transaction_walletId_timestamp_idx" ON "cached_transaction"("walletId", "timestamp");

-- CreateIndex
CREATE INDEX "cached_transaction_walletId_txType_idx" ON "cached_transaction"("walletId", "txType");

-- CreateIndex
CREATE INDEX "daily_activity_walletId_idx" ON "daily_activity"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_activity_walletId_date_key" ON "daily_activity"("walletId", "date");
