-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "external_id" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual';

-- CreateTable
CREATE TABLE "google_calendar_integrations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "calendar_id" TEXT NOT NULL DEFAULT 'primary',
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_calendar_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_calendar_integrations_user_id_key" ON "google_calendar_integrations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_logs_user_id_external_id_key" ON "activity_logs"("user_id", "external_id");

-- AddForeignKey
ALTER TABLE "google_calendar_integrations" ADD CONSTRAINT "google_calendar_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

