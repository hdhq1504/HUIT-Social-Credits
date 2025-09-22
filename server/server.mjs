import express from 'express';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import bodyParser from 'body-parser';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { getAuth } from 'firebase-admin/auth';

import 'dotenv/config';
import './firebaseConfig.js';

const app = express();
const httpServer = http.createServer(app);

/*
    - schema: là tài liệu để mô tả dữ liệu API
        + Query: hoạt động cho phía client muốn truy vấn dữ liệu
        + Mutation: dùng để update, delete dữ liệu
        + Subscription: dùng để xử lý realtime
*/
const typeDefs = `#graphql
    type Query {
        name: String
    }
`;

// resolver xử lý dữ liệu
const resolvers = {
    Query: {
        name: () => 'Nguyen Van Teo',
    },
};

// Middleware kiểm tra token
const authorizationJWT = async (req, res, next) => {
    console.log({ authorizationJWTP: req.headers.authorization });
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const accessToken = authorizationHeader.split(' ')[1];
        const decodedToken = await getAuth().verifyIdToken(accessToken);

        // Gán uid vào req để sử dụng trong context
        req.user = { uid: decodedToken.uid };
        console.log('✅ Xác thực thành công:', decodedToken);

        next();
    } catch (error) {
        console.error('❌ Lỗi xác thực JWT:', error);
        return res.status(403).json({ message: 'Forbidden', error });
    }
};

// khởi động server
const startServer = async () => {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });

    await server.start();

    app.use(cors());
    app.use(bodyParser.json());
    app.use(authorizationJWT);
    app.use(
        '/graphql',
        expressMiddleware(server, {
            context: async ({ req }) => {
                return { uid: req.user?.uid || null };
            },
        }),
    );

    await new Promise((resolve) => httpServer.listen({ port: 8888 }, resolve));
    console.log('🚀 Server ready at http://localhost:8888/graphql');
};

startServer();
