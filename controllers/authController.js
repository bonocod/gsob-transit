const logger = require('../config/logger');
exports.verifyAdminCode = async (req, res) => {
const { adminCode } = req.body;
try {
if (!process.env.ADMIN_CODE) {
throw new Error('Admin code not configured in .env');
}
const validCodes = process.env.ADMIN_CODE.split(',').map(code => code.trim());
if (!adminCode || !validCodes.includes(adminCode)) {
return res.render('admin-code', { errorMessage: 'Invalid admin code', csrfToken: req.csrfToken() });
}
req.session.admin = {
role: 'admin',
name: 'Admin'
};
logger.info('Admin accessed via code', { adminCode });
res.redirect('/admin/dashboard');
} catch (err) {
logger.error('Admin code verification failed', { error: err.message });
res.render('admin-code', { errorMessage: err.message || 'Verification failed', csrfToken: req.csrfToken() });
}
};
exports.logout = (req, res, next) => {
req.session.destroy(err => {
if (err) {
logger.error('Logout failed', { error: err.message });
return next(err);
}
res.clearCookie('connect.sid');
logger.info('Admin logged out');
res.redirect('/');
});
};