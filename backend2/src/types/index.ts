
export interface Usuario {
  cp_id?: number;
  cp_nome: string;
  cp_email: string;
  cp_login: string;
  cp_password: string;
  cp_tipo_user?: number;
  cp_rg?: string;
  cp_cpf: string;
  cp_datanascimento: Date;
  cp_estadocivil?: string;
  cp_cnpj?: bigint;
  cp_ie?: bigint;
  cp_whatsapp?: string;
  cp_telefone: string;
  cp_empresaatuacao?: string;
  cp_profissao?: string;
  cp_end_cidade_estado?: string;
  cp_end_rua?: string;
  cp_end_num?: string;
  cp_end_cep?: string;
  cp_descricao?: string;
  cp_foto_perfil?: string;
  cp_escola_id?: number;
  cp_turma_id?: number;
  cp_excluido?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Escola {
  cp_ec_id?: number;
  cp_ec_nome: string;
  cp_ec_data_cadastro?: Date;
  cp_ec_responsavel?: string;
  cp_ec_endereco_rua?: string;
  cp_ec_endereco_numero?: string;
  cp_ec_endereco_cidade?: string;
  cp_ec_endereco_bairro?: string;
  cp_ec_endereco_estado?: string;
  cp_ec_excluido?: number;
  cp_ec_descricao?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Turma {
  cp_tr_id?: number;
  cp_tr_nome: string;
  cp_tr_data: Date;
  cp_tr_id_professor: number;
  cp_tr_id_escola: number;
  cp_tr_curso_id: number;
  cp_tr_dias_semana?: string;
  cp_tr_horario_inicio?: string;
  cp_tr_horario_fim?: string;
}

export interface Curso {
  cp_curso_id?: number;
  cp_nome_curso: string;
  cp_youtube_link_curso?: string;
  cp_pdf1_curso?: string;
  cp_pdf2_curso?: string;
  cp_pdf3_curso?: string;
}

export interface Audio {
  cp_audio_id?: number;
  cp_curso_id: number;
  cp_nome_audio: string;
  cp_arquivo_audio: string;
}

export interface Matricula {
  cp_mt_id?: number;
  cp_mt_curso: number;
  cp_mt_usuario_id: number;
  cp_mt_escola_id: number;
  cp_mt_nome_usuario: string;
  cp_mt_cpf_usuario: string;
  cp_mt_valor_curso: number;
  cp_mt_numero_parcelas: number;
  cp_mt_parcelas_pagas?: number;
  cp_mt_primeira_data_pagamento: string;
  cp_mt_status: string;
  cp_mt_nivel_idioma?: string;
  cp_mt_horario_inicio?: string;
  cp_mt_horario_fim?: string;
  cp_mt_local_nascimento?: string;
  cp_mt_escolaridade?: string;
  cp_mt_rede_social?: string;
  cp_mt_nome_pai?: string;
  cp_mt_contato_pai?: string;
  cp_mt_nome_mae?: string;
  cp_mt_contato_mae?: string;
  cp_mt_nome_emergencia?: string;
  cp_mt_contato_emergencia?: string;
  cp_mt_tipo_pagamento?: string;
  cp_mt_dias_semana?: string;
  cp_mt_excluido?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface JwtPayload {
  id: number;
  login: string;
  nome: string;
  tipo: number;
  escola_id?: number;
  turma_id?: number;
}
