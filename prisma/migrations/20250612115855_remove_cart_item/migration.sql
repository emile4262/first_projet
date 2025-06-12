/*
  Warnings:

  - The primary key for the `Cart` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Cart` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `isAvailable` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `CartProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `price` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- DropForeignKey
ALTER TABLE "CartProduct" DROP CONSTRAINT "CartProduct_cartId_fkey";

-- DropForeignKey
ALTER TABLE "CartProduct" DROP CONSTRAINT "CartProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "OrderProduct" DROP CONSTRAINT "OrderProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_userId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_productId_fkey";

-- DropIndex
DROP INDEX "Cart_userId_key";

-- AlterTable
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_pkey",
ADD COLUMN     "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Cart_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "isAvailable",
ADD COLUMN     "Is_available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "quantity" INTEGER NOT NULL,
ADD COLUMN     "total" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "admin" DROP DEFAULT,
ALTER COLUMN "role" SET DEFAULT 'user';

-- DropTable
DROP TABLE "CartProduct";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "Product";

-- CreateTable
CREATE TABLE "product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "stockInitial" INTEGER NOT NULL,
    "stockFinal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "Is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderProduct" ADD CONSTRAINT "OrderProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
