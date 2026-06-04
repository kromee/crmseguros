-- CreateTable
CREATE TABLE `login_rate_limits` (
    `email` VARCHAR(255) NOT NULL,
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `resetAt` DATETIME(3) NOT NULL,
    `lastIp` VARCHAR(50) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
