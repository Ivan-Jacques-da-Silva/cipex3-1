/*
  Warnings:

  - You are about to drop the column `cp_excluido` on the `cp_cursos` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `cp_cursos` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `cp_cursos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cp_cursos" DROP COLUMN "cp_excluido",
DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "cp_pdf1_curso" TEXT,
ADD COLUMN     "cp_pdf2_curso" TEXT,
ADD COLUMN     "cp_pdf3_curso" TEXT,
ADD COLUMN     "cp_youtube_link_curso" TEXT;
