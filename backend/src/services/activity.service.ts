import { prisma } from "../lib/prisma.ts";
import { notFound } from "../utils/httpError.ts";
import { serializeActivity, serializeCompletion, type ActivityDto } from "../utils/serializers.ts";

async function progressFor(userId: number, activityIds?: number[]) {
  const rows = await prisma.activityCompletion.groupBy({
    by: ["activityId"],
    where: { userId, ...(activityIds && { activityId: { in: activityIds } }) },
    _count: { _all: true },
    _max: { completedAt: true },
  });
  return new Map(rows.map((r) => [r.activityId, { completedCount: r._count._all, lastCompletedAt: r._max.completedAt }]));
}

export async function activitiesWithProgress(userId: number, category?: string): Promise<ActivityDto[]> {
  const activities = await prisma.activity.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ isFeatured: "desc" }, { id: "asc" }],
  });
  const progress = await progressFor(userId);
  return activities.map((a) => serializeActivity(a, progress.get(a.id)));
}

export async function getActivity(userId: number, id: number) {
  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) throw notFound("Activity not found");
  const progress = await progressFor(userId, [id]);
  return serializeActivity(activity, progress.get(id));
}

export async function completeActivity(userId: number, id: number) {
  if (!(await prisma.activity.findUnique({ where: { id }, select: { id: true } }))) throw notFound("Activity not found");
  const completion = await prisma.activityCompletion.create({
    data: { userId, activityId: id },
    include: { activity: true },
  });
  return serializeCompletion(completion);
}

export async function listCompletions(userId: number, limit: number) {
  const completions = await prisma.activityCompletion.findMany({
    where: { userId },
    orderBy: [{ completedAt: "desc" }, { id: "desc" }],
    take: limit,
    include: { activity: true },
  });
  return completions.map(serializeCompletion);
}
