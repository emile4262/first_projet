/*
  Warnings:

  - You are about to drop the column `orderId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the `_OrderToReview` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_OrderToReview" DROP CONSTRAINT "_OrderToReview_A_fkey";

-- DropForeignKey
ALTER TABLE "_OrderToReview" DROP CONSTRAINT "_OrderToReview_B_fkey";

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "orderId";

-- DropTable
DROP TABLE "_OrderToReview";
