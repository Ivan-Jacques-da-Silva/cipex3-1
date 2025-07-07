import React from "react";
import MasterLayout from "../masterLayout/MasterLayout.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import SalaAula from "../components/SalaDeAulaLayout.jsx";

const SalaDeAulaPage = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Sala de Aula" />

        {/* SalaAula */}
        <SalaAula />

      </MasterLayout>

    </>
  );
};

export default SalaDeAulaPage; 
