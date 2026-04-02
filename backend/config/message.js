/**
 * Created by atthapok on 24/06/2559.
 */

var msg = [];

// General
msg[20000] = { code: 20000,httpcode: 200,message: [{value: "ทำรายการเรียบร้อย",key: "th"},{value: "Success",key: "en"}] };

// General Errors
msg[40000] = { code: 40000,httpcode: 400,message: [{value: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูล",key: "th"},{value: "Bad request: Validation failed",key: "en"}] };
msg[40100] = { code: 40100,httpcode: 401,message: [{value: "ยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อน",key: "th"},{value: "Unauthorized: Please login",key: "en"}] };
msg[40300] = { code: 40300,httpcode: 403,message: [{value: "ข้อมูลไม่ครบ หรือข้อมูลผิดพลาด",key: "th"},{value: "Missing or invalid parameter",key: "en"}] };
msg[40301] = { code: 40301,httpcode: 403,message: [{value: "มีข้อมูลนี้อยู่แล้ว",key: "th"},{value: "Data is duplicated",key: "en"}] };
msg[40302] = { code: 40302,httpcode: 403,message: [{value: "ไม่อนุญาตให้คัดลอกแบบฟอร์มนี้",key: "th"},{value: "Not allowed to duplicate this form",key: "en"}] };
msg[40400] = { code: 40400,httpcode: 404,message: [{value: "ไม่พบข้อมูลนี้ในระบบ",key: "th"},{value: "Data not found",key: "en"}] };
msg[40401] = { code: 40401,httpcode: 404,message: [{value: "ข้อมูลไม่ถูกต้อง",key: "th"},{value: "invalid data",key: "en"}] };
msg[40900] = { code: 40900,httpcode: 409,message: [{value: "ข้อมูลซ้ำกัน",key: "th"},{value: "Conflict: Duplicate data",key: "en"}] };
msg[50000] = { code: 50000,httpcode: 500,message: [{value: "เกิดข้อผิดพลาดภายในระบบ",key: "th"},{value: "Internal server error",key: "en"}] };

//Response Section
msg[20001] = { code: 20001,httpcode: 200,message: [{value: "ดึงคำตอบตามแบบฟอร์มสำเร็จ",key: "th"},{value: "Get responses by form successfully",key: "en"}] };
msg[20002] = { code: 20002,httpcode: 200,message: [{value: "ดึงคำตอบตามรหัสสำเร็จ",key: "th"},{value: "Get response by ID successfully",key: "en"}] };
msg[20003] = { code: 20003,httpcode: 200,message: [{value: "บันทึกคำตอบสำเร็จ",key: "th"},{value: "Create response successfully",key: "en"}] };
msg[20004] = { code: 20004,httpcode: 200,message: [{value: "แก้ไขคำตอบสำเร็จ",key: "th"},{value: "Update response successfully",key: "en"}] };
msg[20005] = { code: 20005,httpcode: 200,message: [{value: "ลบคำตอบสำเร็จ",key: "th"},{value: "Delete response successfully",key: "en"}] };
msg[20006] = { code: 20006,httpcode: 200,message: [{value: "ลบคำตอบตามแบบฟอร์มสำเร็จ",key: "th"},{value: "Delete responses by form successfully",key: "en"}] };
msg[20007] = { code: 20007,httpcode: 200,message: [{value: "ดาวน์โหลดคำตอบผู้ใช้สำเร็จ",key: "th"},{value: "Download user response successfully",key: "en"}] };
msg[20008] = { code: 20008,httpcode: 200,message: [{value: "ดาวน์โหลดคำตอบทั้งหมดสำเร็จ",key: "th"},{value: "Download all responses successfully",key: "en"}] };

//Question Section
msg[20011] = { code: 20011,httpcode: 200,message: [{value: "ดึงคำถามตามรหัสสำเร็จ",key: "th"},{value: "Get question by ID successfully",key: "en"}] };
msg[20012] = { code: 20012,httpcode: 200,message: [{value: "ดึงคำถามทั้งหมดสำเร็จ",key: "th"},{value: "Get questions successfully",key: "en"}] };
msg[20013] = { code: 20013,httpcode: 200,message: [{value: "สร้างคำถามสำเร็จ",key: "th"},{value: "Create question successfully",key: "en"}] };
msg[20014] = { code: 20014,httpcode: 200,message: [{value: "แก้ไขคำถามสำเร็จ",key: "th"},{value: "Update question successfully",key: "en"}] };
msg[20015] = { code: 20015,httpcode: 200,message: [{value: "ลบคำถามสำเร็จ",key: "th"},{value: "Delete question successfully",key: "en"}] };

//Form Section
msg[20021] = { code: 20021,httpcode: 200,message: [{value: "ดึงรายการแบบฟอร์มสำเร็จ",key: "th"},{value: "Get forms successfully",key: "en"}] };
msg[20022] = { code: 20022,httpcode: 200,message: [{value: "ดึงแบบฟอร์มตามรหัสสำเร็จ",key: "th"},{value: "Get form by ID successfully",key: "en"}] };
msg[20023] = { code: 20023,httpcode: 200,message: [{value: "สร้างแบบฟอร์มสำเร็จ",key: "th"},{value: "Create form successfully",key: "en"}] };
msg[20024] = { code: 20024,httpcode: 200,message: [{value: "แก้ไขแบบฟอร์มสำเร็จ",key: "th"},{value: "Update form successfully",key: "en"}] };
msg[20025] = { code: 20025,httpcode: 200,message: [{value: "ลบแบบฟอร์มสำเร็จ",key: "th"},{value: "Delete form successfully",key: "en"}] };

var responseMsg = {};
responseMsg.getMsg = function (code) {
    return msg[code];
}

module.exports = responseMsg;