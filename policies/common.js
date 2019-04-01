module.exports = function(req, res, next) {
    req.glob = {};
    if (req.path == '/login') {
        if (req.session.user_id) {
            return res.redirect('/');
        }
        next();
        return;
    }
    if (req.session.user_id) {
        return db.users
            .find_one({
                where: {
                    user_id: req.session.user_id
                }
            })
            .then(user => {
                req.glob.user = user;
                next();
            })
    } else {
        return res.redirect('/login');    
    }
}
