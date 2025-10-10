import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient()
// use `prisma` in your application to read and write data in your DB

// run inside `async` function
const user = await prisma.user.create({
  data: {
    name: 'Alice',
    email: 'alice@prisma.io',
  },
})

const post = await prisma.post.create({
  data: {
    title: "Hello from Prisma",
    content: "Content example",
    author: {
      connect: { id: user.id }
    }
  },
  include: { author: true }
})