import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import MaterialExtraLayout  from "../components/MaterialExtraLayout";

const MaterialExtra = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Material Extra" />

        {/* MaterialExtra */}
        <MaterialExtraLayout  />

      </MasterLayout>

    </>
  );
};

export default MaterialExtra; 
