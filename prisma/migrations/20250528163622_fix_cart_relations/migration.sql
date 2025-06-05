/*
  Warnings:

  - You are about to drop the column `total` on the `Cart` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `Cart` table. All the data in the column will be lost.
  - You are about to drop the column `totalProduct` on the `Cart` table. All the data in the column will be lost.
  - You are about to drop the column `totalQuantity` on the `Cart` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cart" DROP COLUMN "total",
DROP COLUMN "totalPrice",
DROP COLUMN "totalProduct",
DROP COLUMN "totalQuantity";
