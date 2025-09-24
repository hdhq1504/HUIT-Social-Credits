import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import GlobalStyles from './components/GlobalStyles/GlobalStyles';
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';

// Cấu hình Apollo Client
const client = new ApolloClient({
  uri: 'http://localhost:8888/graphql',
  cache: new InMemoryCache(),
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalStyles>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </GlobalStyles>
  </StrictMode>,
);