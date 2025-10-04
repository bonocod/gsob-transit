module.exports = (req, res, next) => {
if (req.session.studentId) {
next();
} else {
res.redirect('/');
}
};