/**
 * 过滤器
 * Created by massimo on 2014/4/12.
 */

/**
 * 基础验证
 * @param req
 * @param res
 * @param next
 */
exports.$auth = function (req, res, next) {
    if (req.session && req.session.userId) {
        next();
    }
    else {
        res.redirect('/user/login');
    }
};