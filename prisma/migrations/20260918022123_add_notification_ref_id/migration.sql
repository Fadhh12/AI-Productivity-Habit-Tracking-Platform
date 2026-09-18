-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "ref_id" TEXT;

-- CreateIndex
CREATE INDEX "notifications_type_ref_id_idx" ON "notifications"("type", "ref_id");
