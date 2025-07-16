/*
  Warnings:

  - The primary key for the `cp_escolas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cp_id` on the `cp_escolas` table. All the data in the column will be lost.
  - Added the required column `cp_ec_id` to the `cp_escolas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cp_escolas" DROP CONSTRAINT "cp_escolas_pkey",
DROP COLUMN "cp_id",
ADD COLUMN     "cp_ec_id" INTEGER NOT NULL,
ADD CONSTRAINT "cp_escolas_pkey" PRIMARY KEY ("cp_ec_id");
