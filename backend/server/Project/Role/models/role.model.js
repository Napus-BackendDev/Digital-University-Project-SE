const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Roles', RoleSchema);
