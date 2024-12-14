const express = require('express');
const router = express.Router();
const {
    getDefects,
    addDefectWithPicture,
    updateDefect
} = require('../controllers/defectController');

router.get('/', getDefects);
router.post('/', addDefectWithPicture);
router.put('/:defect_id', updateDefect);

module.exports = router;