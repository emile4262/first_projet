/*
  Warnings:

  - You are about to drop the `_CartToProducts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CartToProducts" DROP CONSTRAINT "_CartToProducts_A_fkey";

-- DropForeignKey
ALTER TABLE "_CartToProducts" DROP CONSTRAINT "_CartToProducts_B_fkey";

-- DropTable
DROP TABLE "_CartToProducts";
