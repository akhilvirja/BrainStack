import mongoose from "mongoose";
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema(
    {
        username:{
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function() {
    if(!this.isModified("password")){
        return;
    }

    try {
        const salt = await bcrypt.genSalt(7)
        this.password = await bcrypt.hash(this.password, salt)
    } catch (error) {
        throw error;
    }
})

export const User = mongoose.model("User", userSchema);