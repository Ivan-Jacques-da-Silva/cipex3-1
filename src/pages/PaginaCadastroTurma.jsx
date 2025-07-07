import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CadastroTurma from "../components/CadastroTurma.jsx";

const PaginaCadastroTurma = () => {
  const { id } = useParams(); // Captura o ID da URL
  console.log("Indo ID, ", id)
  return (
    <MasterLayout>
      <Breadcrumb title={id ? "Editar Turma" : "Cadastro de Turma"} />
      <CadastroTurma turmaID={id || null} />
    </MasterLayout>
  );
};

export default PaginaCadastroTurma;
