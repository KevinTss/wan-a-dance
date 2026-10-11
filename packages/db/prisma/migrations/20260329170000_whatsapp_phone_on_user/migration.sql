-- AlterTable
ALTER TABLE "members" DROP COLUMN "whatsappPhone",
ADD COLUMN     "contactPhone" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "whatsappPhone" TEXT;
