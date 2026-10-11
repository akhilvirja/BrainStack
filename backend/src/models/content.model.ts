import mongoose from "mongoose";

const contentTypes = ["image", "video", "article", "audio", "tweet", "link", "document", "note", "bookmark"];

const contentSchema = new mongoose.Schema(
    {
        link: {
            type: String,
            required: true,
            default: "",
        },
        type: {
            type: String,
            enum: contentTypes,
            required: true,
            default: "note",
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String
        },
        tags: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tag"
        }],
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }
    },
    {
        timestamps: true,
    }
)

export const Content = mongoose.model("Content", contentSchema);