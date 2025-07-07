import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CadastroEscola from "../components/CadastroEscola.jsx";

const PaginaCadastroEscola = () => {
  const { id } = useParams();
  return (
    <MasterLayout>
      <Breadcrumb title={id ? "Editar Escola" : "Cadastro de Escola"} />
      <CadastroEscola escolaId={id || null} />
    </MasterLayout>
  );
};

export default PaginaCadastroEscola;
