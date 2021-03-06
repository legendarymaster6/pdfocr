var constant = {
    systemconfigs: {
        ref_id: {
            token: 1,
            incoming_folder: 2,
            output_folder: 3
        }
    },
    googleapi: {
        client_id: '429385296048-9eoklc3g488j1de6r1i2dm5jgh4vn52r.apps.googleusercontent.com',
        client_secret: '7YWjTs0glqMYQHFNWWMToxPy'
    },
    devprod() {
        if (process.env.NODE_ENV == 'production') {
            constant.base_url = 'http://liftpass.io';
        } else {
            constant.base_url = 'http://localhost:3000';
        }
    }
};

constant.devprod();

module.exports = constant;