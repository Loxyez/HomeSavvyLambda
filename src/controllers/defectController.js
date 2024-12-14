const e = require('express');
const pool = require('../models/db');
const { createBlob } = require('@vercel/blob'); // Import Vercel Blob

// Get all defects
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
        console.error('Error fetching defects:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// Add a new defect
exports.addDefectWithPicture = async (req, res) => {
    const { place, detail } = req.body;
    
    try {
        let filePath = null;

        // Check if a file is being uploaded
        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname}`;
            
            // Use Vercel Blob to upload the file
            const blob = await createBlob(req.file.buffer, {
                contentType: req.file.mimetype,
                path: `uploads/${fileName}` // The "path" becomes the folder structure in Blob storage
            });

            filePath = blob.url; // Get the URL of the uploaded file
            console.log('File uploaded to Blob:', filePath);
        }

        // Insert the defect into the database
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
        console.error('Error updating defect:', err.message);
        res.status(500).json({ error: err.message });
    }
};