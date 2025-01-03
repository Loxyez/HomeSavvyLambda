const pool = require('../models/db');
const { put } = require('@vercel/blob');
const multer = require('multer');

const storage = multer.memoryStorage(); // Store in memory (since you're using Vercel Blob)
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

exports.addDefectWithPicture = async (req, res) => {
    try {
        console.log('Request body:', req.body); // Log form data
        console.log('Uploaded file:', req.file); // Log file details

        const { place, detail } = req.body; // Get form data

        const newDefect = await pool.query(
            `INSERT INTO defects (place, detail) VALUES ($1, $2) RETURNING *;`,
            [place, detail]
        );

        const defectId = newDefect.rows[0].defect_id;

        const file = req.file;
        if (!file) {
            throw new Error('File is required for upload.');
        }

        const url = `uploads/${Date.now()}-${file.originalname}`; // Optional unique filename

        const blob = await put(url, file.buffer, {
            access: 'public', // Make file publicly accessible
            contentType: file.mimetype // Set file's MIME type (e.g., image/png, image/jpeg)
        });

        await pool.query(
            `INSERT INTO picture (defect_id, file_path) VALUES ($1, $2) RETURNING *;`,
            [defectId, blob.url] // Store the public URL returned by Vercel Blob
        );

        res.status(201).json({
            message: 'Defect created successfully',
            defect: newDefect.rows[0],
            fileUrl: blob.url // Return the URL for frontend use
        });
    } catch (err) {
        console.error('Error adding defect:', err.message);
        res.status(500).json({ error: err.message });
    }
};

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