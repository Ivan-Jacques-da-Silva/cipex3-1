import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import Turmas from "../components/TurmaLayout";


const UsersGridPage = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Turmas" />

        {/* Turma */}
        <Turmas />

      </MasterLayout>

    </>
  );
};

export default UsersGridPage; 
