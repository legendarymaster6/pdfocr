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
                ]
            })
            .spread((token, incoming_folder, output_folder) => {                
                return res
                .render('dashboard/home', {
                    has_token: token ? true : false,
                    incoming_folder: incoming_folder ? incoming_folder.value : '',
                    output_folder: output_folder ? output_folder.value : '',
                });
            })
            .catch(err => {
                console.log(err);
                return res.redirect('/');
            });
    },

    authorize(req, res) {
        const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
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
                    })
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
                    google_drive_api.get_folder_tree()
                ]
            })
            .spread((incoming, output, tree) => {
                if (!incoming || !output) {
                    throw 'Action not allowed';
                }
                incoming_folder = incoming.value;
                output_folder = output.value;

                return google_drive_api.get_folders();
            })
            .then(folders => {
                incoming_id = google_drive_api.get_folder_id(folders, incoming_folder);
                output_id = google_drive_api.get_folder_id(folders, output_folder);
                
                console.log(tree);
                return res.redirect('/');
            })
    }
}
