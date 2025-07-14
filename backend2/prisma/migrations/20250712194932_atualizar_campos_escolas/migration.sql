/*
  Warnings:

  - You are about to drop the column `cp_ec_endereco` on the `cp_escolas` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cp_escolas" DROP COLUMN "cp_ec_endereco",
ADD COLUMN     "cp_ec_data_cadastro" TIMESTAMP(3),
ADD COLUMN     "cp_ec_descricao" TEXT,
ADD COLUMN     "cp_ec_endereco_bairro" TEXT,
ADD COLUMN     "cp_ec_endereco_cidade" TEXT,
ADD COLUMN     "cp_ec_endereco_estado" TEXT,
ADD COLUMN     "cp_ec_endereco_numero" TEXT,
ADD COLUMN     "cp_ec_endereco_rua" TEXT,
ADD COLUMN     "cp_ec_responsavel" TEXT,
ALTER COLUMN "cp_ec_telefone" DROP NOT NULL,
ALTER COLUMN "cp_ec_email" DROP NOT NULL;
