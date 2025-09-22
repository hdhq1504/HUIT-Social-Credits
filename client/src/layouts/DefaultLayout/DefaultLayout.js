import React from 'react';
import Header from '../../layouts/components/Header/Header';
import Footer from '../../layouts/components/Footer/Footer';

function DefaultLayout({ children }) {
    return (
        <div className="wraper">
            <Header />
            <div className="content">{children}</div>
            <Footer />
        </div>
    );
}

export default DefaultLayout;
