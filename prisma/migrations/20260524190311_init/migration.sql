-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
    `avatar` VARCHAR(500) NULL,
    `title` VARCHAR(100) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contacts` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `type` ENUM('CLIENT', 'PROSPECT') NOT NULL DEFAULT 'PROSPECT',
    `fullName` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(255) NULL,
    `birthDate` DATE NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `origin` ENUM('WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'RECOMENDADO', 'FAMILIA', 'AMIGO', 'STAND', 'GOOGLE_MAPS', 'PUBLICIDAD', 'SITIO_WEB', 'OTRO') NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `assignedTo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `contacts_code_key`(`code`),
    INDEX `contacts_type_status_idx`(`type`, `status`),
    INDEX `contacts_assignedTo_idx`(`assignedTo`),
    INDEX `contacts_phone_idx`(`phone`),
    INDEX `contacts_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `policies` (
    `id` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `policyNumber` VARCHAR(100) NOT NULL,
    `type` ENUM('VIDA', 'AUTO', 'OTRO') NOT NULL,
    `plan` VARCHAR(200) NULL,
    `insurer` VARCHAR(200) NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `paymentFrequency` ENUM('MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL') NOT NULL DEFAULT 'ANUAL',
    `premium` DECIMAL(12, 2) NOT NULL,
    `sumInsured` DECIMAL(15, 2) NULL,
    `beneficiaries` TEXT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'RENEWAL') NOT NULL DEFAULT 'ACTIVE',
    `documents` JSON NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `policies_policyNumber_key`(`policyNumber`),
    INDEX `policies_contactId_idx`(`contactId`),
    INDEX `policies_endDate_idx`(`endDate`),
    INDEX `policies_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pension_services` (
    `id` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `requestDate` DATE NOT NULL,
    `requestType` ENUM('ASESORIA', 'TRAMITE', 'OTRO') NOT NULL DEFAULT 'ASESORIA',
    `pensionLaw` ENUM('IMSS_LEY73', 'AFORE_LEY97', 'OTRO') NULL,
    `cost` DECIMAL(10, 2) NOT NULL,
    `advance` DECIMAL(10, 2) NULL,
    `advanceDate` DATE NULL,
    `settlement` DECIMAL(10, 2) NULL,
    `settlementDate` DATE NULL,
    `description` TEXT NULL,
    `bitacora` TEXT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pension_services_contactId_idx`(`contactId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_services` (
    `id` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `startDate` DATE NOT NULL,
    `serviceType` ENUM('ALTA', 'BAJA', 'PLACAS_NUEVAS', 'RENOVACION_PLACAS', 'TARJETA_CIRCULACION', 'OTRO') NOT NULL,
    `description` TEXT NULL,
    `quote` DECIMAL(10, 2) NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `documents` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `vehicle_services_contactId_idx`(`contactId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prospects` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `stage` ENUM('CONTACTO_INICIAL', 'SEGUIMIENTO', 'COTIZACION', 'CIERRE') NOT NULL DEFAULT 'CONTACTO_INICIAL',
    `priority` ENUM('BAJA', 'MEDIA', 'ALTA', 'ATENCION') NOT NULL DEFAULT 'MEDIA',
    `serviceOfInterest` VARCHAR(200) NULL,
    `estimatedValue` DECIMAL(12, 2) NULL,
    `probability` INTEGER NOT NULL DEFAULT 50,
    `assignedTo` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `nextActionType` ENUM('LLAMADA', 'CITA', 'EMAIL', 'OTRO') NULL,
    `nextActionDate` DATETIME(3) NULL,
    `rating` INTEGER NOT NULL DEFAULT 3,
    `status` ENUM('ACTIVE', 'WON', 'LOST') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `prospects_code_key`(`code`),
    INDEX `prospects_stage_status_idx`(`stage`, `status`),
    INDEX `prospects_assignedTo_idx`(`assignedTo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `id` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `prospectId` VARCHAR(191) NULL,
    `policyId` VARCHAR(191) NULL,
    `type` ENUM('LLAMADA', 'EMAIL', 'WHATSAPP', 'NOTA', 'VISITA', 'DOCUMENTO') NOT NULL,
    `summary` TEXT NOT NULL,
    `result` ENUM('EXITOSO', 'PENDIENTE', 'SIN_RESPUESTA', 'FINALIZADO') NOT NULL DEFAULT 'PENDIENTE',
    `performedBy` VARCHAR(191) NOT NULL,
    `isAutomatic` BOOLEAN NOT NULL DEFAULT false,
    `attachments` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activities_contactId_idx`(`contactId`),
    INDEX `activities_prospectId_idx`(`prospectId`),
    INDEX `activities_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `calendar_events` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(300) NOT NULL,
    `type` ENUM('RENOVACION', 'COBRO_PAGO', 'SEGUIMIENTO', 'LLAMADA', 'TAREA') NOT NULL,
    `contactId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `description` TEXT NULL,
    `priority` ENUM('BAJA', 'MEDIA', 'ALTA', 'ATENCION') NOT NULL DEFAULT 'MEDIA',
    `notifyClient` BOOLEAN NOT NULL DEFAULT false,
    `notifyAgent` BOOLEAN NOT NULL DEFAULT true,
    `reminderMinutes` INTEGER NOT NULL DEFAULT 15,
    `attachments` JSON NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `syncGoogle` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `calendar_events_userId_startDate_idx`(`userId`, `startDate`),
    INDEX `calendar_events_type_status_idx`(`type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(100) NOT NULL,
    `entityId` VARCHAR(36) NOT NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW') NOT NULL,
    `changes` JSON NULL,
    `ipAddress` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `audit_log_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_assignedTo_fkey` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `policies` ADD CONSTRAINT `policies_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pension_services` ADD CONSTRAINT `pension_services_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_services` ADD CONSTRAINT `vehicle_services_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prospects` ADD CONSTRAINT `prospects_assignedTo_fkey` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_prospectId_fkey` FOREIGN KEY (`prospectId`) REFERENCES `prospects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_policyId_fkey` FOREIGN KEY (`policyId`) REFERENCES `policies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_performedBy_fkey` FOREIGN KEY (`performedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_events_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
