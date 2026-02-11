import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    sourceId: { type: String, default: "", trim: true, index: true }, // id จาก upstream (ถ้ามี)
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    syncedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

CourseSchema.index({ sourceId: 1 }, { unique: false });
CourseSchema.index({ name: 1 }, { unique: false });

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);
