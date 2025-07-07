import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CadastroMatricula from "../components/CadastroMatricula.jsx";

const PaginaCadastroMatricula = () => {
  const { matriculaId } = useParams(); // Captura o ID da URL
  return (
    <MasterLayout>
      <Breadcrumb title={matriculaId ? "Editar Matrícula" : "Cadastro de Matrícula"} />
      <CadastroMatricula matriculaId={matriculaId || null} />
    </MasterLayout>
  );
};

export default PaginaCadastroMatricula;
