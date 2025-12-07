"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var objSchema = new Schema(
  {
    // responder: { type: Schema.Types.ObjectId, ref: 'users' },
    form: { type: Schema.Types.ObjectId, ref: "Forms", required: true },
    answers: [
      {
        question: { type: Schema.Types.ObjectId, ref: "Questions" },
        response: { type: Schema.Types.Mixed },
      },
    ],
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-update Form's responses array when a new Response is created
objSchema.post("save", async function (doc, next) {
  try {
    const Form = mongoose.model("Forms");
    await Form.findByIdAndUpdate(doc.form, { $push: { responses: doc._id } });
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Responses", objSchema, "Responses");
