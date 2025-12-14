const cron = require('node-cron');
const FormModel = require('../models/form.model');
const { STATUS } = require('../service/formStatus'); 

cron.schedule('* * * * *', async () => {
    const now = new Date();
    console.log(`Form Scheduler running at ${now.toISOString()}`);

    // 1) เปิดฟอร์มอัตโนมัติ (เฉพาะ auto mode)
    await FormModel.updateMany(
        {
            status: { $in: [STATUS.DRAFT, STATUS.AUTO] },
            "schedule.startAt": { $ne: null, $lte: now }
        },
        {
            $set: { status: STATUS.OPEN }
        }
    );

    // 2) ปิดฟอร์มอัตโนมัติ (เฉพาะ auto mode)
    await FormModel.updateMany(
        {
            status: { $in: [STATUS.OPEN, STATUS.AUTO] },
            "schedule.endAt": { $ne: null, $lte: now }
        },
        {
            $set: { status: STATUS.CLOSE }
        }
    );
});
