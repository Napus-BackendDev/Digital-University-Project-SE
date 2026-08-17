'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Role = require('../server/Project/User/models/roles.model');
const User = require('../server/Project/User/models/user.model');

const pages = ['Forms', 'Manage Forms', 'Analytics', 'Permissions', 'Email'];
const access = (create, read, update, remove) => [
  { key: 'create', value: create },
  { key: 'read', value: read },
  { key: 'update', value: update },
  { key: 'delete', value: remove }
];

async function upsertRole(name, thai, permissions) {
  return Role.findOneAndUpdate(
    { 'title.value': name },
    { $set: { title: [{ key: 'en', value: name }, { key: 'th', value: thai }], permission: permissions } },
    { upsert: true, new: true }
  );
}

async function run() {
  await mongoose.connect(process.env.MONGODB);
  const admin = await upsertRole('Admin', 'ผู้ดูแลระบบ', pages.map(page => ({ page, access: access(true, true, true, true) })));
  const staff = await upsertRole('Staff', 'เจ้าหน้าที่', [
    { page: 'Forms', access: access(false, true, false, false) },
    { page: 'Manage Forms', access: access(true, true, true, true) },
    { page: 'Analytics', access: access(false, true, false, false) },
    { page: 'Email', access: access(true, true, true, false) }
  ]);
  const user = await upsertRole('User', 'ผู้ใช้งาน', [
    { page: 'Forms', access: access(false, true, false, false) }
  ]);

  await User.updateMany({ role: { $nin: [admin._id, staff._id, user._id] } }, { $set: { role: user._id } });
  await User.updateMany({ email: { $in: ['mark@lamduan.mfu.ac.th', 'san@lamduan.mfu.ac.th'] } }, { $set: { role: staff._id } });
  await User.updateOne({ email: '6631503129@lamduan.mfu.ac.th' }, { $set: { role: admin._id } });
  console.log(`Permission roles ready: Admin=${admin._id} Staff=${staff._id} User=${user._id}`);
  await mongoose.disconnect();
}

run().catch(async error => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
