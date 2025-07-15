-- AlterTable
ALTER TABLE "cp_registro_aulas" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
CREATE SEQUENCE cp_turmas_cp_tr_id_seq;
ALTER TABLE "cp_turmas" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "cp_tr_id" SET DEFAULT nextval('cp_turmas_cp_tr_id_seq');
ALTER SEQUENCE cp_turmas_cp_tr_id_seq OWNED BY "cp_turmas"."cp_tr_id";
