/*
  Warnings:

  - You are about to drop the column `cp_tr_data_fim` on the `cp_turmas` table. All the data in the column will be lost.
  - You are about to drop the column `cp_tr_data_inicio` on the `cp_turmas` table. All the data in the column will be lost.
  - You are about to drop the column `cp_tr_dias_semana` on the `cp_turmas` table. All the data in the column will be lost.
  - You are about to drop the column `cp_tr_escola_id` on the `cp_turmas` table. All the data in the column will be lost.
  - You are about to drop the column `cp_tr_horario_fim` on the `cp_turmas` table. All the data in the column will be lost.
  - You are about to drop the column `cp_tr_horario_inicio` on the `cp_turmas` table. All the data in the column will be lost.
  - You are about to drop the column `cp_tr_professor_id` on the `cp_turmas` table. All the data in the column will be lost.
  - Added the required column `cp_tr_data` to the `cp_turmas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cp_tr_id_escola` to the `cp_turmas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cp_tr_id_professor` to the `cp_turmas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cp_turmas" DROP COLUMN "cp_tr_data_fim",
DROP COLUMN "cp_tr_data_inicio",
DROP COLUMN "cp_tr_dias_semana",
DROP COLUMN "cp_tr_escola_id",
DROP COLUMN "cp_tr_horario_fim",
DROP COLUMN "cp_tr_horario_inicio",
DROP COLUMN "cp_tr_professor_id",
ADD COLUMN     "cp_tr_data" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "cp_tr_id_escola" INTEGER NOT NULL,
ADD COLUMN     "cp_tr_id_professor" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "cp_usuarios" ALTER COLUMN "cp_end_cep" SET DATA TYPE TEXT,
ALTER COLUMN "cp_end_num" SET DATA TYPE TEXT;
