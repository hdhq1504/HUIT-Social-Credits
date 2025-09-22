import React from 'react';
import Header from '../../layouts/components/Header/Header';

function HeaderOnly({ children }) {
    return (
        <div className="wraper">
            <Header />
            <div className="content">{children}</div>
        </div>
    );
}

export default HeaderOnly;
