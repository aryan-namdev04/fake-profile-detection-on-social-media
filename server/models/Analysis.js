const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    username: {
        type: String,
        required: true,
    },

    riskScore: {
        type: Number,
        required: true,
    },

    verdict: {
        type: String,
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    }

});

module.exports = mongoose.model("Analysis", analysisSchema);