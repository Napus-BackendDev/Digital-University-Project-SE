const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: '' },
    givenName: { type: String, default: '' },
    familyName: { type: String, default: '' },
    picture: { type: String, default: '' },
    roles: [{ type: Schema.Types.ObjectId, ref: 'Roles' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Users', UserSchema);
