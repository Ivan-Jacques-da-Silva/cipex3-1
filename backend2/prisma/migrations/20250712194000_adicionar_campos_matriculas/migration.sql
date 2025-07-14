-- AlterTable
ALTER TABLE "cp_matriculas" ADD COLUMN     "cp_mt_dias_semana" TEXT,
ADD COLUMN     "cp_mt_parcelas_pagas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cp_mt_tipo_pagamento" TEXT DEFAULT 'parcelado';
