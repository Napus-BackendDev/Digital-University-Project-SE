"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var objSchema = new Schema(
  {
    responder: { type: Schema.Types.ObjectId, ref: "Users", required: true },
    form: { type: Schema.Types.ObjectId, ref: "Forms", required: true, index: true },
    answers: [
      {
        question: { type: Schema.Types.ObjectId, ref: "Questions" },
        response: { type: Schema.Types.Mixed },
      },
    ],
    submit: { type: Schema.Types.Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-update Form and User arrays when a new Response is created
objSchema.post("save", async function (doc, next) {
  try {
    const Form = mongoose.model("Forms");
    const User = mongoose.model("Users");

    // Update Form's responses array
    await Form.findByIdAndUpdate(doc.form, { $push: { responses: doc._id } });

    // Update User's response array
    await User.findByIdAndUpdate(doc.responder, { $push: { response: doc._id } });

    next();
  } catch (err) {
    next(err);
  }
});

// Auto-remove Response from Form and User arrays when a Response is deleted
objSchema.pre("deleteMany", async function (next) {
  try {
    const query = this.getQuery();
    if (query._id) {
      const Form = mongoose.model("Forms");
      const User = mongoose.model("Users");

      // Pull from Form
      await Form.updateMany(
        { responses: query._id },
        { $pull: { responses: query._id } }
      );

      // Pull from User
      await User.updateMany(
        { response: query._id },
        { $pull: { response: query._id } }
      );
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Responses", objSchema, "Responses");