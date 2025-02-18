// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message,
            details: Object.values(err.errors).map(error => ({
                field: error.path,
                message: error.message
            }))
        });
    }

    if (err.code === 11000) {
        return res.status(400).json({
            error: 'Duplicate Error',
            message: 'A record with this information already exists',
            field: Object.keys(err.keyPattern)[0]
        });
    }

    res.status(err.status || 500).json({
        error: err.name || 'Server Error',
        message: err.message || 'Something went wrong'
    });
};

module.exports = errorHandler;