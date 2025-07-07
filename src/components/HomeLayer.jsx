import React from 'react'
import SalesStatisticOne from './child/Carrousel';
import MenuHome from './child/MenuHome';

const ElementoHome = () => {

    return (
        <>
            <MenuHome />

            <section className="row gy-4 mt-1">
                <SalesStatisticOne />
            </section>

        </>


    )
}

export default ElementoHome