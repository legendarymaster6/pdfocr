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
                    db.systemconfigs.find_one({
                        where: {
                            ref_id: constant.systemconfigs.ref_id.token,
                        }
                    }),
                    db.systemconfigs.find_one({
                        where: {
                            ref_id: constant.systemconfigs.ref_id.incoming_folder,
                        }
                    }),
                    db.systemconfigs.find_one({
                        where: {
                            ref_id: constant.systemconfigs.ref_id.output_folder,
                        }
                    }),
                    db.rules.find_all({
                        order: ['index']
                    })
                ]
            })
            .spread((token, incoming_folder, output_folder, rules) => {                
                return res
                .render('dashboard/home', {
                    has_token: token ? true : false,
                    incoming_folder: incoming_folder ? incoming_folder.value : '',
                    output_folder: output_folder ? output_folder.value : '',
                    rules
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
            'http://localhost:3000/get-token'
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
            'http://localhost:3000/get-token'
        );

        return new Promise((resolve, reject) => {
                oAuth2Client.getToken(code, (err, token) => {
                    if (err) reject(err);
                    else resolve(token);
                })
            })
            .then(token => {
                console.log(token);
                return db.systemconfigs.find_or_create({
                        where: {
                            ref_id: constant.systemconfigs.ref_id.token,
                        },
                        defaults: {
                            value: JSON.stringify(token)
                        }
                    })
                    .spread((systemconfig, created) => {
                        if (created) return null;
                        systemconfig.value = JSON.stringify(token);
                        return systemconfig.save();
                    })
                    .then(() => {
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
            'http://localhost:3000/get-token'
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
                            pageSize: 10,
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

        return db.systemconfigs.find_or_create({
                where: {
                    ref_id: constant.systemconfigs.ref_id.incoming_folder,
                },
                defaults: {
                    value: incoming_folder
                }
            })
            .spread((systemconfig, created) => {
                if (created) return null;
                systemconfig.value = incoming_folder;
                return systemconfig.save();
            })
            .then(() => {
                return db.systemconfigs.find_or_create({
                        where: {
                            ref_id: constant.systemconfigs.ref_id.output_folder,
                        },
                        defaults: {
                            value: output_folder
                        }
                    })
            })
            .spread((systemconfig, created) => {
                if (created) return null;
                systemconfig.value = output_folder;
                return systemconfig.save();
            })
            .then(() => {
                return res
                    .send({
                        status: 'ok'
                    });
            })
            .catch(err => {
                console.log(err);
                return res
                    .send({
                        status: 'error'
                    })
            });
    },

    categorization(req, res) {
        var incoming_folder, output_folder;
        var incoming_id, output_id;
        return q.fcall(() => {})
            .then(() => {
                return [
                    db.systemconfigs.find_one({
                        where: {
                            ref_id: constant.systemconfigs.ref_id.incoming_folder,
                        }
                    }),
                    db.systemconfigs.find_one({
                        where: {
                            ref_id: constant.systemconfigs.ref_id.output_folder,
                        }
                    }),
                    google_drive_api.get_folders(),
                    db.rules.find_all({
                        order: ['index']
                    })
                ]
            })
            .spread((incoming, output, folders, rules) => {
                if (!incoming || !output) {
                    throw 'Action not allowed';
                }
                incoming_folder = incoming.value;
                output_folder = output.value;
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
                            return google_drive_api.get_files(incoming_id, rule.text, rule.is_contained)
                        })
                        .then(files => {
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
                                    return google_drive_api.move_file(file.id, file.parents[0], push_folder)
                                });
                            }
                            return chain;
                        });
                }
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
                        message: error.message || error
                    }
                });
            })
    },

    update_rule(req, res) {
        var { name, is_contained, text, destination, rule_id } = req.body;

        return db.rules.find_one({
                where: {
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
            .then(err => {
                console.log(err);
                return res.send({
                    status: 'error'
                })
            })
    },

    create_rule(req, res) {
        var { name, is_contained, text, destination } = req.body;
        return db.rules.count()
            .then(count => {
                return db.rules.create({
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
            .then(err => {
                console.log(err);
                return res.send({
                    status: 'error'
                })
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
                    status: 'error'
                })
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
                    status: 'error'
                })
            })
    }

}
