const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(constant.googleapi.client_id);

module.exports = {
    login(req, res) {
        if (req.method == 'GET') {
            return res.render(
                'auth/login.twig', {}
            );
        }

        var { id_token } = req.body;
        return client
            .verifyIdToken({
                idToken: id_token,
                audience: constant.googleapi.client_id
            })
            .then(ticket => {
                var payload = ticket.getPayload();
                var google_id = payload['sub'];
                return db.users
                    .find_or_create({
                        where: {
                            google_id
                        }
                    })
                    .spread((user, created) => {
                        req.session.user_id = user.user_id;
                        return res.send({
                            status: 'ok',
                            payload: {
                                has_token: user.google_token != null,
                            }
                        });
                    });
            })
            .catch(err => {
                console.log(err);
                return res
                    .send({
                        status: 'error',
                        payload: {
                            message: err.message || err
                        }
                    });
            });
    },

    logout(req, res) {
        delete req.session.user_id;
        res.redirect('/login');
    }
}
