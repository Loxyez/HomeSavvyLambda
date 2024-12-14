const e = require('express');
const pool = require('../models/db');
const multer = require('multer');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});


const upload = multer({ storage: storage });

exports.getDefects = async (req, res) => {
    try {
        const defects = await pool.query(
            `SELECT
                d.defect_id,
                d.place,
                d.detail,
                d.status,
                d.progress,
                COALESCE(json_agg(p.file_path) FILTER (WHERE p.file_path IS NOT NULL), '[]'::JSON) AS pictures
            FROM defects d
            LEFT JOIN picture p ON d.defect_id = p.defect_id
            GROUP BY d.defect_id
            ORDER BY d.created_at DESC;`
        );

        const defectsWithPictures = defects.rows.map(defect => {
            defect.pictures = defect.pictures.map(picture => `${picture}`);
            return defect;
        });

        res.json(defectsWithPictures);
    } catch (err) {
        console.error('Error fetching defects:', err.message); // Fixed variable name from 'error' to 'err'
        res.status(500).json({ error: err.message }); // Make sure to use 'err' consistently
    }
}

// Add a new defect
exports.addDefectWithPicture = [
    upload.single('picture'),
    async (req, res) => {
        const { place, detail } = req.body;
        const filePath = req.file ? '/uploads/' + req.file.filename : null;

        try {
            const newDefect = await pool.query(
                `INSERT INTO defects (place, detail) VALUES ($1, $2) RETURNING *;`,
                [place, detail]
            );

            const defectId = newDefect.rows[0].defect_id;

            if (filePath) {
                await pool.query(
                    `INSERT INTO picture (defect_id, file_path) VALUES ($1, $2);`,
                    [defectId, filePath]
                );
            }

            res.status(201).json({ message: 'Defect added successfully', defect: newDefect.rows[0] });
        } catch (err) {
            console.error('Error adding defect:', err.message); // Fixed variable name from 'error' to 'err'
            res.status(500).json({ error: err.message }); // Make sure to use 'err' consistently
        }
    },
];

// Update defect status or progress
exports.updateDefect = async (req, res) => {
    const { status, progress } = req.body;
    const { defect_id } = req.params;

    try {
        const updatedDefect = await pool.query(
            `UPDATE defects SET status = $1, progress = $2, updated_at = NOW() WHERE defect_id = $3 RETURNING *;`,
            [status, progress, defect_id]
        );
        res.json(updatedDefect.rows[0]);
    } catch (err) {
        console.error('Error updating defect:', err.message); // Fixed variable name from 'error' to 'err'
        res.status(500).json({ error: err.message }); // Make sure to use 'err' consistently
    }
}