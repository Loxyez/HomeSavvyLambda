module.exports = (err, req, res, next) => {
    console.log(err.stacks);
    res.status(500).json({ error: error.message });
};