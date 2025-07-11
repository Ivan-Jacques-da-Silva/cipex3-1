-- CreateTable
CREATE TABLE "cp_usuarios" (
    "cp_id" SERIAL NOT NULL,
    "cp_nome" TEXT NOT NULL,
    "cp_cpf" TEXT NOT NULL,
    "cp_data_nascimento" TEXT NOT NULL,
    "cp_telefone" TEXT NOT NULL,
    "cp_email" TEXT NOT NULL,
    "cp_senha" TEXT NOT NULL,
    "cp_foto_perfil" TEXT,
    "cp_local_nascimento" TEXT,
    "cp_escolaridade" TEXT,
    "cp_rede_social" TEXT,
    "cp_nome_pai" TEXT,
    "cp_contato_pai" TEXT,
    "cp_nome_mae" TEXT,
    "cp_contato_mae" TEXT,
    "cp_nome_emergencia" TEXT,
    "cp_contato_emergencia" TEXT,
    "cp_tipo_usuario" INTEGER,
    "cp_excluido" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cp_usuarios_pkey" PRIMARY KEY ("cp_id")
);

-- CreateTable
CREATE TABLE "cp_escolas" (
    "cp_ec_id" SERIAL NOT NULL,
    "cp_ec_nome" TEXT NOT NULL,
    "cp_ec_telefone" TEXT NOT NULL,
    "cp_ec_email" TEXT NOT NULL,
    "cp_ec_endereco" TEXT NOT NULL,
    "cp_ec_excluido" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cp_escolas_pkey" PRIMARY KEY ("cp_ec_id")
);

-- CreateTable
CREATE TABLE "cp_cursos" (
    "cp_id_curso" SERIAL NOT NULL,
    "cp_nome_curso" TEXT NOT NULL,
    "cp_descricao_curso" TEXT,
    "cp_preco_curso" DOUBLE PRECISION NOT NULL,
    "cp_duracao_meses" INTEGER NOT NULL,
    "cp_excluido" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cp_cursos_pkey" PRIMARY KEY ("cp_id_curso")
);

-- CreateTable
CREATE TABLE "cp_turmas" (
    "cp_tr_id" SERIAL NOT NULL,
    "cp_tr_nome" TEXT NOT NULL,
    "cp_tr_curso_id" INTEGER NOT NULL,
    "cp_tr_professor_id" INTEGER NOT NULL,
    "cp_tr_escola_id" INTEGER NOT NULL,
    "cp_tr_horario_inicio" TEXT NOT NULL,
    "cp_tr_horario_fim" TEXT NOT NULL,
    "cp_tr_dias_semana" TEXT NOT NULL,
    "cp_tr_data_inicio" TEXT NOT NULL,
    "cp_tr_data_fim" TEXT NOT NULL,
    "cp_tr_excluido" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cp_turmas_pkey" PRIMARY KEY ("cp_tr_id")
);

-- CreateTable
CREATE TABLE "cp_matriculas" (
    "cp_mt_id" SERIAL NOT NULL,
    "cp_mt_curso" INTEGER NOT NULL,
    "cp_mt_usuario_id" INTEGER NOT NULL,
    "cp_mt_escola_id" INTEGER NOT NULL,
    "cp_mt_nome_usuario" TEXT NOT NULL,
    "cp_mt_cpf_usuario" TEXT NOT NULL,
    "cp_mt_valor_curso" DOUBLE PRECISION NOT NULL,
    "cp_mt_numero_parcelas" INTEGER NOT NULL,
    "cp_mt_primeira_data_pagamento" TEXT NOT NULL,
    "cp_mt_status" TEXT NOT NULL,
    "cp_mt_nivel_idioma" TEXT,
    "cp_mt_horario_inicio" TEXT,
    "cp_mt_horario_fim" TEXT,
    "cp_mt_local_nascimento" TEXT,
    "cp_mt_escolaridade" TEXT,
    "cp_mt_rede_social" TEXT,
    "cp_mt_nome_pai" TEXT,
    "cp_mt_contato_pai" TEXT,
    "cp_mt_nome_mae" TEXT,
    "cp_mt_contato_mae" TEXT,
    "cp_mt_nome_emergencia" TEXT,
    "cp_mt_contato_emergencia" TEXT,
    "cp_mt_excluido" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cp_matriculas_pkey" PRIMARY KEY ("cp_mt_id")
);

-- CreateTable
CREATE TABLE "cp_audios" (
    "cp_aud_id" SERIAL NOT NULL,
    "cp_aud_titulo" TEXT NOT NULL,
    "cp_aud_descricao" TEXT,
    "cp_aud_arquivo" TEXT NOT NULL,
    "cp_aud_curso_id" INTEGER,
    "cp_aud_excluido" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cp_audios_pkey" PRIMARY KEY ("cp_aud_id")
);

-- CreateTable
CREATE TABLE "cp_mat_extra" (
    "cp_mat_extra_id" SERIAL NOT NULL,
    "cp_mat_extra_title" TEXT NOT NULL,
    "cp_mat_extra_category" TEXT NOT NULL,
    "cp_mat_extra_desc" TEXT,
    "cp_mat_extra_file" TEXT NOT NULL,
    "cp_mat_extra_categories" TEXT,
    "cp_mat_extra_codigos" TEXT,
    "cp_mat_extra_thumbnail" TEXT,
    "cp_mat_extra_pdf1" TEXT,
    "cp_mat_extra_pdf2" TEXT,
    "cp_mat_extra_pdf3" TEXT,
    "cp_mat_extra_permitirDownload" INTEGER,
    "cp_mat_extra_excluido" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cp_mat_extra_pkey" PRIMARY KEY ("cp_mat_extra_id")
);

-- CreateTable
CREATE TABLE "cp_mat_materiais" (
    "cp_mat_id" SERIAL NOT NULL,
    "cp_mat_titulo" TEXT NOT NULL,
    "cp_mat_descricao" TEXT,
    "cp_mat_extra_date" TIMESTAMP(3),
    "cp_mat_linkYoutube" TEXT,
    "cp_mat_miniatura" TEXT,
    "cp_mat_arquivoPdf" TEXT,
    "cp_mat_extra_pdf2" TEXT,
    "cp_mat_extra_pdf3" TEXT,
    "cp_mat_extra_categories" TEXT,
    "cp_mat_permitirDownload" INTEGER,
    "cp_mat_extra_excluido" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cp_mat_materiais_pkey" PRIMARY KEY ("cp_mat_id")
);

-- CreateTable
CREATE TABLE "cp_resumos" (
    "cp_res_id" SERIAL NOT NULL,
    "cp_res_turma_id" INTEGER NOT NULL,
    "cp_res_data" TIMESTAMP(3) NOT NULL,
    "cp_res_hora" TEXT NOT NULL,
    "cp_res_resumo" TEXT,
    "cp_res_arquivo" TEXT,
    "cp_res_aula" TEXT,
    "cp_res_link" TEXT,
    "cp_res_link_youtube" TEXT,
    "cp_res_excluido" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cp_resumos_pkey" PRIMARY KEY ("cp_res_id")
);

-- CreateTable
CREATE TABLE "cp_registro_aulas" (
    "cp_reg_id" SERIAL NOT NULL,
    "cp_reg_turma_id" INTEGER NOT NULL,
    "cp_reg_professor_id" INTEGER NOT NULL,
    "cp_reg_data" TEXT NOT NULL,
    "cp_reg_horario_inicio" TEXT NOT NULL,
    "cp_reg_horario_fim" TEXT NOT NULL,
    "cp_reg_observacoes" TEXT,
    "cp_reg_presentes" TEXT,
    "cp_reg_excluido" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cp_registro_aulas_pkey" PRIMARY KEY ("cp_reg_id")
);

-- CreateTable
CREATE TABLE "cp_historico_chamadas" (
    "cp_hist_id" SERIAL NOT NULL,
    "cp_hist_aluno_id" INTEGER NOT NULL,
    "cp_hist_turma_id" INTEGER NOT NULL,
    "cp_hist_data" TEXT NOT NULL,
    "cp_hist_presente" BOOLEAN NOT NULL,
    "cp_hist_observacao" TEXT,
    "cp_hist_excluido" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cp_historico_chamadas_pkey" PRIMARY KEY ("cp_hist_id")
);
