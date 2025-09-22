import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import GlobalStyles from './components/GlobalStyles/GlobalStyles';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';

// Cấu hình Apollo Client
const client = new ApolloClient({
    uri: 'http://localhost:8888/graphql', // Địa chỉ server GraphQL của bạn
    cache: new InMemoryCache(),
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <GlobalStyles>
            <ApolloProvider client={client}>
                <App />
            </ApolloProvider>
        </GlobalStyles>
    </React.StrictMode>,
);

reportWebVitals();
