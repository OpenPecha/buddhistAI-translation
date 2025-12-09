-- CreateTable
CREATE TABLE "TranslationContextFile" (
    "id" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "geminiFileId" TEXT,
    "extractedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "TranslationContextFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TranslationContextFile_documentId_idx" ON "TranslationContextFile"("documentId");

-- AddForeignKey
ALTER TABLE "TranslationContextFile" ADD CONSTRAINT "TranslationContextFile_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Doc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
