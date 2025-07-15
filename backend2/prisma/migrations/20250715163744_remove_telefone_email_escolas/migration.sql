/*
  Warnings:

  - You are about to drop the column `cp_ec_email` on the `cp_escolas` table. All the data in the column will be lost.
  - You are about to drop the column `cp_ec_telefone` on the `cp_escolas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cp_escolas" DROP COLUMN "cp_ec_email",
DROP COLUMN "cp_ec_telefone";
