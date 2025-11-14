import prisma from "../prisma.js";

export const notifyUser = async ({ userId, title, message, type = "info", data = null }) => {
  if (!userId) return null;

  return prisma.thongBao.create({
    data: {
      nguoiDungId: userId,
      tieuDe: title,
      noiDung: message,
      loai: type,
      duLieu: data,
    },
  });
};

export default notifyUser;