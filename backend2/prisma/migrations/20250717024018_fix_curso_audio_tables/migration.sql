/*
  Warnings:

  - You are about to drop the `cp_cursos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "cp_cursos";

-- CreateTable
CREATE TABLE "cp_curso" (
    "cp_curso_id" SERIAL NOT NULL,
    "cp_nome_curso" TEXT NOT NULL,
    "cp_youtube_link_curso" TEXT,
    "cp_pdf1_curso" TEXT,
    "cp_pdf2_curso" TEXT,
    "cp_pdf3_curso" TEXT,

    CONSTRAINT "cp_curso_pkey" PRIMARY KEY ("cp_curso_id")
);

-- CreateTable
CREATE TABLE "cp_audio" (
    "cp_audio_id" SERIAL NOT NULL,
    "cp_curso_id" INTEGER NOT NULL,
    "cp_nome_audio" TEXT NOT NULL,
    "cp_arquivo_audio" TEXT NOT NULL,

    CONSTRAINT "cp_audio_pkey" PRIMARY KEY ("cp_audio_id")
);
