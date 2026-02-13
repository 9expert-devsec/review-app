import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Review from "@/models/Review";
import { requireAdmin } from "@/lib/adminAuth.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    await dbConnect();

    const pipeline = [
      {
        $facet: {
          // ✅ รวมทุกสถานะ (pending/approved/rejected)
          totals: [
            {
              $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                activeReviews: { $sum: { $cond: ["$isActive", 1, 0] } },

                pendingReviews: {
                  $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                },
                approvedReviews: {
                  $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
                },
                rejectedReviews: {
                  $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
                },

                // ✅ avg ทั้งหมด (รวม pending)
                avgRating: { $avg: "$rating" },

                // ✅ avg เฉพาะ active (ถ้าไม่มีจะเป็น null)
                activeAvgRating: {
                  $avg: { $cond: ["$isActive", "$rating", null] },
                },

                // ✅ avg เฉพาะ approved (ถ้าไม่มีจะเป็น null)
                approvedAvgRating: {
                  $avg: {
                    $cond: [{ $eq: ["$status", "approved"] }, "$rating", null],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalReviews: 1,
                activeReviews: 1,
                pendingReviews: 1,
                approvedReviews: 1,
                rejectedReviews: 1,
                avgRating: { $ifNull: ["$avgRating", 0] },
                activeAvgRating: { $ifNull: ["$activeAvgRating", 0] },
                approvedAvgRating: { $ifNull: ["$approvedAvgRating", 0] },
              },
            },
          ],

          // ✅ แจกแจงดาว “รวมทุกสถานะ”
          ratingDist: [
            { $group: { _id: "$rating", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],

          // ✅ ต่อคอร์ส “รวมทุกสถานะ”
          perCourse: [
            {
              $group: {
                _id: { courseId: "$courseId", courseName: "$courseName" },
                reviewCount: { $sum: 1 },
                avgRating: { $avg: "$rating" },
                activeCount: { $sum: { $cond: ["$isActive", 1, 0] } },
                pendingCount: {
                  $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
                },
                approvedCount: {
                  $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
                },
                rejectedCount: {
                  $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
                },
                lastReviewAt: { $max: "$createdAt" },
              },
            },
            { $sort: { reviewCount: -1, lastReviewAt: -1 } },
            {
              $project: {
                _id: 0,
                courseId: "$_id.courseId",
                courseName: "$_id.courseName",
                reviewCount: 1,
                avgRating: { $ifNull: ["$avgRating", 0] },
                activeCount: 1,
                pendingCount: 1,
                approvedCount: 1,
                rejectedCount: 1,
                lastReviewAt: 1,
              },
            },
          ],

          // ล่าสุด (คงไว้เหมือนเดิม)
          latest: [
            { $sort: { createdAt: -1 } },
            { $limit: 8 },
            {
              $project: {
                courseName: 1,
                reviewerName: 1,
                rating: 1,
                headline: 1,
                comment: 1,
                status: 1,
                isActive: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
    ];

    const [result] = await Review.aggregate(pipeline);

    const totals = result?.totals?.[0] || {
      totalReviews: 0,
      activeReviews: 0,
      avgRating: 0,
      pendingReviews: 0,
      approvedReviews: 0,
      rejectedReviews: 0,
      activeAvgRating: 0,
      approvedAvgRating: 0,
    };

    const distMap = new Map(
      (result?.ratingDist || []).map((x) => [x._id, x.count]),
    );
    const ratingDist = [1, 2, 3, 4, 5].map((r) => ({
      rating: r,
      count: distMap.get(r) || 0,
    }));

    return NextResponse.json({
      ok: true,
      totals,
      ratingDist,
      perCourse: result?.perCourse || [],
      latest: result?.latest || [],
    });
  } catch (e) {
    const status = e?.status || 500;
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status },
    );
  }
}
