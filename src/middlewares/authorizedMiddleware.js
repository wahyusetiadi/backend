const authorize = (roles) => {
    return (req, res, next) => {
        const useRole = req.user.role;
        if(!roles.include(userRole)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.'});
        }
        next();
    };
};

module.exports =authorize;