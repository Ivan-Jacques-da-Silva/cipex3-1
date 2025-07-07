import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import Audios from "../components/AudioLayout";


const WidgetsPage = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Áudios" />

        {/* Audios */}
        <Audios />

      </MasterLayout>

    </>
  );
};

export default WidgetsPage; 
