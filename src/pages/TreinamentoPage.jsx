import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import Treinamento from "../components/TreinamentoLayout";


const TreinamentoPage = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Treinamento" />

        {/* Treinamento */}
        <Treinamento />

      </MasterLayout>

    </>
  );
};

export default TreinamentoPage; 
