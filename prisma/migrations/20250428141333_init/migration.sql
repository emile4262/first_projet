-- AlterTable
ALTER TABLE "product" ADD CONSTRAINT "product_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "product_id_key";
