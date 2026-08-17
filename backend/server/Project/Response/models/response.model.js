"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// Ensure other models are registered so we can update them in hooks
require("../../Form/models/form.model");
require("../../User/models/user.model");

var objSchema = new Schema(
  {
    responder: { type: Schema.Types.ObjectId, ref: "Users", default: null },
    responderEmail: { type: String, default: null, trim: true, lowercase: true },
    responderName: { type: String, default: null, trim: true },
    submissionKey: { type: String, default: null },
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

// Atomic protection against concurrent duplicate submissions when a form limits responses.
objSchema.index(
  { submissionKey: 1 },
  { unique: true, partialFilterExpression: { submissionKey: { $type: "string" } } }
);

// Auto-update Form and User arrays when a new Response is created
objSchema.post("save", async function (doc, next) {
  try {
    const Form = mongoose.model("Forms");
    const User = mongoose.model("Users");

    // Update Form's responses array
    await Form.findByIdAndUpdate(doc.form, { $push: { responses: doc._id } });

    // Update User's response array
    if (doc.responder) await User.findByIdAndUpdate(doc.responder, { $push: { response: doc._id } });

    next();
  } catch (err) {
    next(err);
  }
});

// Auto-remove Response from Form and User arrays when a Response is deleted
objSchema.pre("deleteMany", async function () {
  try {
    const query = this.getQuery();
    const id = query._id;

    if (id) {
      // Ensure we have an array of IDs to handle both single and many deletes
      const ids = Array.isArray(id) ? id : (id.$in ? id.$in : [id]);
      
      // Use mongoose.models for better access
      const Form = mongoose.models.Forms;
      const User = mongoose.models.Users;



      for (const deleteId of ids) {
        // Pull from Form if Form model exists
        if (Form) {
          await Form.updateMany(
            { responses: deleteId },
            { $pull: { responses: deleteId } }
          );
        }

        // Pull from User if User model exists
        if (User) {
          await User.updateMany(
            { response: deleteId },
            { $pull: { response: deleteId } }
          );
        }
      }
    }
  } catch (err) {
    console.error("Error in pre-deleteMany hook for Responses:", err);
    // In an async hook, returning or throwing an error is enough.
    // If we want the main operation to continue, we just log and return.
  }
});

module.exports = mongoose.model("Responses", objSchema, "Responses");
