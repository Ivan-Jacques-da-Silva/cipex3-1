import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import Usuarios from "../components/UsuarioLayout.jsx";


const Usuario = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Usuários" />

        {/* Usuarios */}
        <Usuarios />

      </MasterLayout>

    </>
  );
};

export default Usuario; 
