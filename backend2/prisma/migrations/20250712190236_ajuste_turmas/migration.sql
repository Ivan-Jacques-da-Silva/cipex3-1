/*
  Warnings:

  - You are about to drop the column `cp_tr_excluido` on the `cp_turmas` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `cp_turmas` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `cp_turmas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cp_turmas" DROP COLUMN "cp_tr_excluido",
DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ALTER COLUMN "cp_tr_id" DROP DEFAULT;
DROP SEQUENCE "cp_turmas_cp_tr_id_seq";
