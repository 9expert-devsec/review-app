import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      index: true,
    },
    courseName: { type: String, default: "", trim: true, index: true },

    reviewerName: { type: String, default: "", trim: true, index: true },
    reviewerEmail: { type: String, default: "", trim: true },
    reviewerEmailLower: { type: String, default: "", trim: true, index: true },
    reviewerCompany: { type: String, default: "", trim: true },
    reviewerRole: { type: String, default: "", trim: true },

    rating: { type: Number, required: true, min: 1, max: 5, index: true },

    headline: { type: String, default: "", trim: true, index: true },
    comment: { type: String, default: "", trim: true },

    avatarUrl: { type: String, default: "" },
    avatarPublicId: { type: String, default: "" }, // เผื่ออนาคตลบ Cloudinary

    consentAccepted: { type: Boolean, default: false },
    consentAcceptedAt: { type: Date, default: null },
    consentVersion: { type: String, default: "v1" },

    pinnedAt: { type: Date, default: null, index: true },
    body: { type: String, default: "" }, // ถ้ายังไม่มี

    // ✅ Moderation
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    statusUpdatedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectReason: { type: String, default: "", trim: true },
    moderatedBy: { type: String, default: "", trim: true }, // เช่น admin email
    displayOrder: { type: Number, default: 9999, index: true },

    // ✅ Public visibility
    isActive: { type: Boolean, default: false, index: true },

    source: { type: String, default: "public" },
  },
  { timestamps: true },
);

// ReviewSchema.index({ courseId: 1, createdAt: -1 });
// ReviewSchema.index({ status: 1, isActive: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
