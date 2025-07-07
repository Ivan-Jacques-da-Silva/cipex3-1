import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import Escola from "../components/EscolasLayout";


const Escolas = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Escolas" />

        {/* Escola */}
        <Escola />

      </MasterLayout>

    </>
  );
};

export default Escolas; 
