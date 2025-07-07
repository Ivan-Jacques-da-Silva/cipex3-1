import React from "react";
import MasterLayout from "../masterLayout/MasterLayout.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import SalaAulaAluno from "../components/SalaDeAulaAlunoLayout.jsx";

const SalaDeAulaPage = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Sala de Aula" />

        {/* SalaAulaAluno */}
        <SalaAulaAluno />

      </MasterLayout>

    </>
  );
};

export default SalaDeAulaPage; 
