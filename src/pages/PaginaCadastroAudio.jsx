import React from "react";
import { useParams } from "react-router-dom";
import MasterLayout from "../masterLayout/MasterLayout.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import CadastroAudio from "../components/CadastroAudio.jsx";

const PaginaCadastroAudio = () => {
  const { id } = useParams(); // Captura o ID da URL
  return (
    <MasterLayout>
      <Breadcrumb title={id ? "Editar Áudio" : "Cadastro de Áudio"} />
      <CadastroAudio audioID={id || null} />
    </MasterLayout>
  );
};

export default PaginaCadastroAudio;
