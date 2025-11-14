import prisma from "../../prisma.js";
import { isValidPointGroup } from "../../utils/points.js";
import { summarizeFaceProfile } from "../../utils/face.js";
import {
  ACTIVITY_INCLUDE,
  REGISTRATION_INCLUDE,
  mapActivity,
  buildActivityResponse,
  sanitizeOptionalText,
} from "./activity.utils.js";

export const listActivities = async (req, res) => {
  const currentUserId = req.user?.sub;

  const { limit, sort, search, pointGroup } = req.query || {};
  const take = limit ? parseInt(limit, 10) : undefined;
  let orderBy = [{ batDauLuc: "asc" }, { tieuDe: "asc" }];

  if (sort === "createdAt:desc") {
    orderBy = [{ createdAt: "desc" }];
  }

  const searchTerm = sanitizeOptionalText(search, 100);
  const normalizedPointGroup = isValidPointGroup(pointGroup) ? pointGroup : undefined;

  const where = {
    isPublished: true,
    ...(normalizedPointGroup ? { nhomDiem: normalizedPointGroup } : {}),
    ...(searchTerm
      ? {
          OR: [
            { tieuDe: { contains: searchTerm, mode: "insensitive" } },
            { diaDiem: { contains: searchTerm, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const activities = await prisma.hoatDong.findMany({
    where,
    orderBy,
    take,
    include: ACTIVITY_INCLUDE,
  });

  let registrationMap = new Map();
  let faceProfileSummary = null;
  if (currentUserId && activities.length) {
    const registrations = await prisma.dangKyHoatDong.findMany({
      where: {
        nguoiDungId: currentUserId,
        hoatDongId: { in: activities.map((activity) => activity.id) },
      },
      include: REGISTRATION_INCLUDE,
    });
    registrationMap = new Map(registrations.map((registration) => [registration.hoatDongId, registration]));
    const faceProfile = await prisma.faceProfile.findUnique({ where: { nguoiDungId: currentUserId } });
    faceProfileSummary = summarizeFaceProfile(faceProfile);
  }

  res.json({
    activities: activities.map((activity) =>
      mapActivity(activity, registrationMap.get(activity.id), { faceEnrollment: faceProfileSummary })
    ),
  });
};

export const getActivity = async (req, res) => {
  const currentUserId = req.user?.sub;
  const activity = await buildActivityResponse(req.params.id, currentUserId);
  if (!activity) return res.status(404).json({ error: "Hoạt động không tồn tại" });
  res.json({ activity });
};