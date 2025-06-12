/*
  Warnings:

  - The primary key for the `Cart` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Cart_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Cart_id_seq";

-- CreateTable
CREATE TABLE "_CartToproduct" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CartToproduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CartToproduct_B_index" ON "_CartToproduct"("B");

-- AddForeignKey
ALTER TABLE "_CartToproduct" ADD CONSTRAINT "_CartToproduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartToproduct" ADD CONSTRAINT "_CartToproduct_B_fkey" FOREIGN KEY ("B") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
