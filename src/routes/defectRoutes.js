const express = require('express');
const router = express.Router();
const {
    getDefects,
    addDefectWithPicture,
    updateDefect
} = require('../controllers/defectController');
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/', getDefects);
router.post('/', upload.single('picture'), addDefectWithPicture);
router.put('/:defect_id', updateDefect);

module.exports = router;