import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
// import { ApolloClient, InMemoryCache } from '@apollo/client';
// import { ApolloProvider } from '@apollo/client/react';

// Cấu hình Apollo Client
// const client = new ApolloClient({
//   uri: 'http://localhost:8888/graphql',
//   cache: new InMemoryCache(),
// });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
