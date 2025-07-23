-- CreateTable
CREATE TABLE "signalements" (
    "id" TEXT NOT NULL,
    "codeBarres" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "datePeremption" TIMESTAMP(3) NOT NULL,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signalements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "signalements_createdAt_idx" ON "signalements"("createdAt" DESC);
