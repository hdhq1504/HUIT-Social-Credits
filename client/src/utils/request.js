import { GRAPQL_SERVER } from './constants';

export const graphQlRequest = async (payload, options = {}) => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
        console.error('❌ Không tìm thấy accessToken trong localStorage!');
        throw new Error('Unauthorized: No access token found');
    }

    const res = await fetch(`${GRAPQL_SERVER}/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            ...options,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        console.error(`❌ Lỗi khi gọi GraphQL: ${res.status} - ${res.statusText}`);
        throw new Error(`GraphQL request failed: ${res.status}`);
    }

    const { data, errors } = await res.json();

    if (errors) {
        console.error('❌ GraphQL Errors:', errors);
        throw new Error('GraphQL Error');
    }

    return data;
};
