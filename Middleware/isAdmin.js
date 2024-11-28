function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next(); // Allow access
    } else {
        res.status(403).send('Access Forbidden: Admins Only'); // Deny access
    }
}

module.exports = isAdmin;
