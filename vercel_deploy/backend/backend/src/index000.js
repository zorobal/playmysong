import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // ✅ sans options

//const prisma = new PrismaClient({
  //datasource: {
   // db: {
      // adapter: 'postgresql',
      //url: process.env.DATABASE_URL,
    //},
  //},
//});

export default prisma;
