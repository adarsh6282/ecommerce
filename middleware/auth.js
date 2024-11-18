const auth=(req,res,next) => {
    res.locals.user = req.session.user || null;
        
        if (['/account', '/wishlist', '/cart'].includes(req.url)) {
            if (!req.session.user) {
                return res.redirect('/register');
            }
            return next();
        } else if (['/register', '/login'].includes(req.url)) {
            if (req.session.user) {
                return res.redirect('/');
            }
            return next();
        }
        return next();
    };
    
    module.exports = auth;
