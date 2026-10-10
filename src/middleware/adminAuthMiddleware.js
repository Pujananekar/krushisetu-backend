const requireAdmin = (req,res,next) => {
    if(!req.session?.admin?.id){
        return res.status(401).json({
            success : false,
            message : "Authentication required."
        })
    }

    req.admin = req.session.admin
    next();
};

export default requireAdmin