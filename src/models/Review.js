import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    // ผู้รีวิว
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    company: { type: String, default: "", trim: true },
    jobTitle: { type: String, default: "", trim: true },

    // หลักสูตร + คะแนน
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    courseName: { type: String, default: "", trim: true }, // snapshot ตอนส่ง
    rating: { type: Number, required: true, min: 1, max: 5, index: true },

    // เนื้อหา
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },

    // รูปโปรไฟล์ (Cloudinary)
    avatarUrl: { type: String, default: "", trim: true },
    avatarPublicId: { type: String, default: "", trim: true },

    // consent
    consent: { type: Boolean, default: false, index: true },

    // สถานะสำหรับแอดมิน
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
