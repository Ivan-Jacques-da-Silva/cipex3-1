-- AlterTable
CREATE SEQUENCE cp_escolas_cp_ec_id_seq;
ALTER TABLE "cp_escolas" ALTER COLUMN "cp_ec_id" SET DEFAULT nextval('cp_escolas_cp_ec_id_seq');
ALTER SEQUENCE cp_escolas_cp_ec_id_seq OWNED BY "cp_escolas"."cp_ec_id";

-- AlterTable
CREATE SEQUENCE cp_turmas_cp_tr_id_seq;
ALTER TABLE "cp_turmas" ALTER COLUMN "cp_tr_id" SET DEFAULT nextval('cp_turmas_cp_tr_id_seq');
ALTER SEQUENCE cp_turmas_cp_tr_id_seq OWNED BY "cp_turmas"."cp_tr_id";
