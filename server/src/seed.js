import bcrypt from "bcrypt";
import prisma from "./prisma.js";

const seed = async () => {
  const passwordHash = await bcrypt.hash("Qu@nHo1504", 10);
  await prisma.user.upsert({
    where: { email: "2001223947@huit.edu.vn" },
    update: {},
    create: {
      email: "2001223947@huit.edu.vn",
      passwordHash,
      fullName: "Hồ Đức Hoàng Quân",
      role: "STUDENT"
    }
  });
  console.log("Seeded user: 2001223947@huit.edu.vn / Qu@nHo1504");
  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
