const cron = require('node-cron');
const FormModel = require('../models/form.model');

cron.schedule('* * * * *', async () => {
    const now = new Date();
    console.log("Cron running at:", now);

    // 1) เปิดฟอร์มอัตโนมัติ (เฉพาะ auto mode)
    await FormModel.updateMany(
        {
            status: 'draft',
            "schedule.mode": "auto",
            "schedule.startAt": { $lte: now }
        },
        {
            $set: { status: 'open' }
        }
    );

    // 2) ปิดฟอร์มอัตโนมัติ (เฉพาะ auto mode)
    await FormModel.updateMany(
        {
            status: { $ne: 'close' },
            "schedule.mode": "auto",
            "schedule.endAt": { $lte: now }
        },
        {
            $set: { status: 'close' }
        }
    );
});
