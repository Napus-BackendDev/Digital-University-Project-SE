const express = require('express');
const router = express.Router();

const question = require('./service/question');

<<<<<<< HEAD

=======
router.get("/id", question.onQuery);
>>>>>>> 1323ecf7565e31d908c5310182fa1b0e09496dd5
router.get("", question.onQuerys);
router.post("", question.onCreate);
router.put("", question.onUpdate);
router.delete("", question.onDelete);

module.exports = router;