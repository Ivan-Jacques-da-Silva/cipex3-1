import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import Financeiro from "../components/FinanceiroLayout";


const WidgetsPage = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Financeiro" />

        {/* Financeiro */}
        <Financeiro />

      </MasterLayout>

    </>
  );
};

export default WidgetsPage; 
