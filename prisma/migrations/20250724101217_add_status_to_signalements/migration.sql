-- CreateEnum
CREATE TYPE "SignalementStatus" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'A_DESTOCKER', 'DETRUIT');

-- AlterTable
ALTER TABLE "signalements" ADD COLUMN     "status" "SignalementStatus" NOT NULL DEFAULT 'EN_ATTENTE';

-- CreateIndex
CREATE INDEX "signalements_status_idx" ON "signalements"("status");

-- CreateIndex
CREATE INDEX "signalements_status_datePeremption_idx" ON "signalements"("status", "datePeremption" DESC);
