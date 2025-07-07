import React from "react";
import MasterLayout from "../masterLayout/MasterLayout.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import Matricuas from "../components/MatriculasLayout.jsx";

const MatriculaPage = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Matriculas" />

        {/* matricuas */}
        <Matricuas />

      </MasterLayout>

    </>
  );
};

export default MatriculaPage; 
