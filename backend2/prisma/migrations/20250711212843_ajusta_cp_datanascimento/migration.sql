/*
  Warnings:

  - You are about to drop the column `cp_contato_emergencia` on the `cp_usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `cp_contato_mae` on the `cp_usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `cp_contato_pai` on the `cp_usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `cp_data_nascimento` on the `cp_usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `cp_escolaridade` on the `cp_usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `cp_local_nascimento` on the `cp_usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `cp_nome_emergencia` on the `cp_usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `cp_nome_mae` on the `cp_usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `cp_nome_pai` on the `cp_usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `cp_rede_social` on the `cp_usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `cp_senha` on the `cp_usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `cp_tipo_usuario` on the `cp_usuarios` table. All the data in the column will be lost.
  - Added the required column `cp_datanascimento` to the `cp_usuarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cp_login` to the `cp_usuarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cp_password` to the `cp_usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cp_usuarios" DROP COLUMN "cp_contato_emergencia",
DROP COLUMN "cp_contato_mae",
DROP COLUMN "cp_contato_pai",
DROP COLUMN "cp_data_nascimento",
DROP COLUMN "cp_escolaridade",
DROP COLUMN "cp_local_nascimento",
DROP COLUMN "cp_nome_emergencia",
DROP COLUMN "cp_nome_mae",
DROP COLUMN "cp_nome_pai",
DROP COLUMN "cp_rede_social",
DROP COLUMN "cp_senha",
DROP COLUMN "cp_tipo_usuario",
ADD COLUMN     "cp_cnpj" BIGINT,
ADD COLUMN     "cp_datanascimento" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "cp_descricao" TEXT,
ADD COLUMN     "cp_empresaatuacao" TEXT,
ADD COLUMN     "cp_end_cep" INTEGER,
ADD COLUMN     "cp_end_cidade_estado" TEXT,
ADD COLUMN     "cp_end_num" INTEGER,
ADD COLUMN     "cp_end_rua" TEXT,
ADD COLUMN     "cp_escola_id" INTEGER,
ADD COLUMN     "cp_estadocivil" TEXT,
ADD COLUMN     "cp_ie" BIGINT,
ADD COLUMN     "cp_login" TEXT NOT NULL,
ADD COLUMN     "cp_password" TEXT NOT NULL,
ADD COLUMN     "cp_profissao" TEXT,
ADD COLUMN     "cp_rg" TEXT,
ADD COLUMN     "cp_tipo_user" INTEGER,
ADD COLUMN     "cp_turma_id" INTEGER,
ADD COLUMN     "cp_whatsapp" TEXT;
