import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import AgendaLayout from "../components/AgendaLayout";


const CalendarMainPage = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Agenda" />

        {/* AgendaLayout */}
        <AgendaLayout />


      </MasterLayout>
    </>
  );
};

export default CalendarMainPage;
