'use strict';
const q = require('q');
const fs = require('fs');
const { google } = require('googleapis');
const readline = require('readline');

module.exports = {
    home(req, res) {
        return q.fcall(() => {})
            .then(() => {
                return [
                    db.users.find_one({
                        where: {
                            user_id: req.session.user_id,
                        }
                    }),
                    db.rules.find_all({
                        where: {
                            user_id: req.session.user_id,
                        },
                        order: ['index']
                    }),
                    req.glob.user.google_token ? google_drive_api.get_folders(req.glob.user.google_token) : []
                ]
            })
            .spread((user, rules, folders) => {
                return res
                    .render('dashboard/home', {
                        has_token: user.google_token ? true : false,
                        incoming_folder: user.input_folder ? user.input_folder : '',
                        output_folder: user.output_folder ? user.output_folder : '',
                        rules,
                        folders
                    });
            })
            .catch(err => {
                console.log(err);
                return res.redirect('/');
            });
    },

    authorize(req, res) {
        const SCOPES = ['https://www.googleapis.com/auth/drive'];
        const oAuth2Client = new google.auth.OAuth2(
            constant.googleapi.client_id, 
            constant.googleapi.client_secret, 
            `${ constant.base_url }/get-token`
        );
      
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent select_account'
        });
        return res.redirect(authUrl);
    },

    get_token(req, res) {
        let { code, scope } = req.query;
        const oAuth2Client = new google.auth.OAuth2(
            constant.googleapi.client_id, 
            constant.googleapi.client_secret,
            `${ constant.base_url }/get-token`
        );
            
        return new Promise((resolve, reject) => {
                oAuth2Client.getToken(code, (err, token) => {
                    if (err) reject(err);
                    else resolve(token);
                })
            })
            .then(token => {
                req.glob.user.google_token = JSON.stringify(token);
                return req.glob.user.save()
                    .then(user => {
                        return res.redirect('/');
                    });
            })
            .catch(err => {
                console.log(err);
                return res.redirect('/');
            });
    },

    list_files(req, res) {
        const oAuth2Client = new google.auth.OAuth2(
            constant.googleapi.client_id, 
            constant.googleapi.client_secret, 
            `${ constant.base_url }/get-token`
        );

        var token;
    
        return db.systemconfigs.find_one({
                where: {
                    ref_id: constant.systemconfigs.ref_id.token,
                }
            })
            .then(systemconfig => {
                token = systemconfig.value;
                oAuth2Client.setCredentials(JSON.parse(token));
                const drive = google.drive({version: 'v3', auth: oAuth2Client});

                return new Promise((resolve, reject) => {
                        drive.files.list({
                            pageSize: 1000,
                            fields: 'nextPageToken, files(id, name, parents)',
                            q: "mimeType='application/vnd.google-apps.folder'",
                        }, (err, res) => {
                            if (err) reject(err);
                            else resolve(res);
                        });    
                    })
                    .then(res => {
                        console.log('ok');
                        const files = res.data.files;
                        if (files.length) {
                            console.log('Files:');
                            files.map((file) => {
                                console.log(file);
                                // console.log(`${file.name} (${file.id})`);
                            });
                        } else {
                            console.log('No files found.');
                        }
                    });
            })
    },

    update_folder(req, res) {
        var { incoming_folder, output_folder } = req.body;

        req.glob.user.input_folder = incoming_folder;
        req.glob.user.output_folder = output_folder;
        return req.glob.user.save()
            .then(() => {
                return res
                    .send({
                        status: 'ok'
                    });
            })
            .catch(err => {
                console.log(err);
                return res.send({
                    status: 'error',
                    payload: {
                        message: err.message || err
                    }
                });
            })
    },

    categorization(req, res) {
        var incoming_folder, output_folder;
        var incoming_id, output_id;
        var token = req.glob.user.google_token;
        if (!token) {
            return res.send({
                status: 'error',
                payload: {
                    message: 'Please authorize your drive first'
                }
            });
        }
        return q.fcall(() => {})
            .then(() => {
                return [
                    google_drive_api.get_folders(token),
                    db.rules.find_all({
                        where: {
                            user_id: req.session.user_id
                        },
                        order: ['index']
                    })
                ]
            })
            .spread((folders, rules) => {
                incoming_folder = req.glob.user.input_folder;
                output_folder = req.glob.user.output_folder;
                if (!incoming_folder || !output_folder) {
                    throw 'Please input imcoming and output folders';
                }
                incoming_id = google_drive_api.get_folder_id(folders, incoming_folder);
                output_id = google_drive_api.get_folder_id(folders, output_folder);
                if (!incoming_id) {
                    throw 'No such incomming folder';
                }
                if (!output_id) {
                    throw 'No such output folder';
                }
                console.log(incoming_id);
                console.log(output_id);
                let p = Promise.resolve();
                for (let rule of rules) {
                    p = p.then(() => {
                            console.log(rule.text);
                            return google_drive_api.get_files(token, incoming_id, rule.text, rule.is_contained)
                        })
                        .then(files => {
                            console.log(files);
                            var push_folder = output_id;
                            if (rule.destination) {
                                var dest_id = google_drive_api.get_folder_id(folders, rule.destination);
                                if (dest_id) {
                                    push_folder = dest_id;
                                }
                            }
                            let chain = Promise.resolve();
                            for (let file of files) {
                                chain = chain.then(() => {
                                    return google_drive_api.move_file(token, file.id, file.parents[0], push_folder)
                                });
                            }
                            return chain;
                        });
                }
                // go to default folder
                p = p.then(() => {
                        return google_drive_api.get_files(token, incoming_id);
                    })
                    .then(files => {
                        console.log(files);
                        var push_folder = output_id;
                        let chain = Promise.resolve();
                        for (let file of files) {
                            chain = chain.then(() => {
                                return google_drive_api.move_file(token, file.id, file.parents[0], push_folder)
                            });
                        }
                        return chain;
                    });
                return p;
            })
            .then(() => {
                return res.send({
                    status: 'ok'
                })
            })
            .catch(err => {
                console.log(err);
                return res.send({
                    status: 'error',
                    payload: {
                        message: err.message || err
                    }
                });
            })
    },

    update_rule(req, res) {
        var { name, is_contained, text, destination, rule_id } = req.body;

        return db.rules.find_one({
                where: {
                    user_id: req.session.user_id,
                    rule_id
                }
            })
            .then(rule => {
                rule.name = name;
                rule.is_contained = is_contained;
                rule.text = text;
                rule.destination = destination
                return rule.save();
            })
            .then(_ => {
                return res
                    .send({
                        status: 'ok'
                    })
            })
            .catch(err => {
                console.log(err);
                return res.send({
                    status: 'error',
                    payload: {
                        message: err.message || err
                    }
                });
            })
    },

    delete_rule(req, res) {
        var { rule_id } = req.body;
        var delete_index;
        if (!rule_id) {
            return res.send({
                status: 'error',
                payload: {
                    message: 'Action not allow'
                }
            });
        }
        return db.rules.find_one({
                where: {
                    rule_id: rule_id
                }
            })
            .then(rule => {
                delete_index = rule.index;
                return rule.destroy();
            })
            .then(_ => {
                console.log(delete_index);
                return db.rules.find_all({
                        where: {
                            user_id: req.session.user_id,
                            index: {
                                $gt: delete_index
                            }                            
                        }
                    })
                    .then(rules => {
                        let p = Promise.resolve();
                        for (let rule of rules) {
                            console.log('rule_id', rule.rule_id);
                            p = p.then(() => {
                                    rule.index = rule.index - 1;
                                    return rule.save();
                                });
                        }
                        return p;
                    })
            })
            .then(_ => {
                return res.send({ status: 'ok' })
            })
            .catch(err => {
                console.log(err);
                return res.send({
                    status: 'error',
                    payload: {
                        message: err.message || err
                    }
                });
            })
    },

    create_rule(req, res) {
        var { name, is_contained, text, destination } = req.body;
        return db.rules.count({
                where: {
                    user_id: req.session.user_id,
                }
            })
            .then(count => {
                return db.rules.create({
                        user_id: req.session.user_id,
                        name,
                        is_contained,
                        text,
                        destination,
                        index: count + 1
                    });
            })
            .then(rule => {
                return res.send({
                    status: 'ok',
                    payload: rule
                })
            })
            .catch(err => {
                console.log(err);
                return res.send({
                    status: 'error',
                    payload: {
                        message: err.message || err
                    }
                });
            })
    },

    move_rule_up(req, res) {
        var { rule_id } = req.body;

        return db.rules.find_one({
                where: {
                    rule_id
                }
            })
            .then(rule => {
                if (rule.index == 1) throw 'Action not allowed';
                return db.rules.find_one({
                        where: {
                            user_id: req.session.user_id,
                            index: rule.index - 1
                        }
                    })
                    .then(rule_up => { 
                        rule.index = rule.index - 1;
                        rule_up.index = rule_up.index + 1;
                        rule.save();
                        rule_up.save();
                    })
            })
            .then(() => {
                return res.send({
                    status: 'ok'
                })
            })
            .catch(err => {
                console.log(err);
                return res.send({
                    status: 'error',
                    payload: {
                        message: err.message || err
                    }
                });
            })
    },

    move_rule_down(req, res) {
        var { rule_id } = req.body;

        return db.rules.find_one({
                where: {
                    rule_id
                }
            })
            .then(rule => {
                return db.rules.find_one({
                        where: {
                            user_id: req.session.user_id,
                            index: rule.index + 1
                        }
                    })
                    .then(rule_down => {
                        if (!rule_down) throw 'action not allowed';
                        rule.index = rule.index + 1;
                        rule_down.index = rule_down.index - 1;
                        rule.save();
                        rule_down.save();
                    })
            })
            .then(() => {
                return res.send({
                    status: 'ok'
                })
            })
            .catch(err => {
                console.log(err);
                return res.send({
                    status: 'error',
                    payload: {
                        message: err.message || err
                    }
                });
            })
    }

}
