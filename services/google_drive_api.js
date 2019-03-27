'use strict'

const { google } = require('googleapis');

module.exports = {
    get_drive_object() {
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
                if (!systemconfig) return null;
                token = systemconfig.value;
                oAuth2Client.setCredentials(JSON.parse(token));
                return google.drive({version: 'v3', auth: oAuth2Client});
            })
            .catch(err => {
                console.log(err);
                return null;
            });
    },

    get_folders() {
        return this.get_drive_object()
            .then(drive => {
                return new Promise((resolve, reject) => {
                        drive.files.list({
                            pageSize: 10,
                            fields: 'nextPageToken, files(id, name, parents)',
                            q: "mimeType='application/vnd.google-apps.folder'",
                            spaces: 'drive',
                        }, (err, res) => {
                            if (err) reject(err);
                            else resolve(res);
                        });    
                    });
            })
            .then(res => {
                var folders = res.data.files;
                var idx = {};
                for (var i = 0; i < folders.length; i++) {
                    idx[folders[i].id] = i;
                }
                for (let folder of folders) {
                    var curid = folder.id;
                    var path = folder.name;
                    while (1) {
                        var cur = folders[idx[curid]];
                        if (!cur.parents) break;
                        curid = cur.parents[0];
                        if (!idx.has_own_property(curid)) break;
                        path = folders[idx[curid]].name + '/' + path;
                    }
                    folder.path = path;
                }
                return folders;
            })
            .catch(err => {
                console.log(err);
                return [];
            });
    },

    get_folder_id(folders, path) {
        for (let folder of folders) {
            if (folder.path == path) {
                return folder.id;
            }
        }
        return null;
    },

    get_files(folder_id, text = '', is_contained = 0) {
        return this.get_drive_object()
            .then(drive => {
                let query = `mimeType != 'application/vnd.google-apps.folder' and ('${folder_id}' in parents)`;
                if (text) {
                    query += `  and (${ is_contained ? '' : 'not' } fullText contains '${ text }')`
                }
                return new Promise((resolve, reject) => {
                        drive.files.list({
                            pageSize: 10,
                            fields: 'nextPageToken, files(id, name, parents)',
                            q: query,
                            spaces: 'drive',
                        }, (err, res) => {
                            if (err) reject(err);
                            else resolve(res);
                        });    
                    })
                    .then(res => {
                        return res.data.files;
                    });
            })
    },

    move_file(file_id, from_folder_id, to_folder_id) {
        return this.get_drive_object()
            .then(drive => {
                return new Promise((resolve, reject) => {
                        drive.files.update({
                            fileId: file_id,
                            addParents: to_folder_id,
                            removeParents: from_folder_id,
                            fields: 'id, parents'
                        }, function (err, file) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(file);
                            }
                        });
                    });
            });
    }
}