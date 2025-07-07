import React from "react";
import { useParams } from "react-router-dom"; 
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import CadastroUsuario from "../components/CadastroUsuario";

const PaginaCadastroUsuario = () => {
  const { id } = useParams(); // Captura o ID da URL
  console.log("ID capturado:", id); // Verifica se o ID está sendo capturado corretamente

  return (
    <MasterLayout>
      <Breadcrumb title={id ? "Editar Usuário" : "Cadastro de Usuário"} />
      <CadastroUsuario userId={id || null} />
    </MasterLayout>
  );
};

export default PaginaCadastroUsuario;
