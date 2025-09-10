-- CreateTable
CREATE TABLE "public"."portfolio_files" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portfolio_files_userId_idx" ON "public"."portfolio_files"("userId");

-- AddForeignKey
ALTER TABLE "public"."portfolio_files" ADD CONSTRAINT "portfolio_files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
