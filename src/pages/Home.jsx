import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import HomeLayer from "../components/HomeLayer";

const HomePageOne = () => {
  return (
    <>
      {/* MasterLayout */}
      <MasterLayout>
        {/* Breadcrumb */}
        <Breadcrumb title="Home" />


        {/* HomeLayer */}
        <HomeLayer />

      </MasterLayout>
    </>
  );
};

export default HomePageOne;
