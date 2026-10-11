import mongoose from "mongoose";

const tagsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    },
    {
        timestamps: true,
    }
)

export const Tag = mongoose.model("Tag", tagsSchema);