'use strict'

const { google } = require('googleapis');

module.exports = {
    get_drive_object(token) {
        const oAuth2Client = new google.auth.OAuth2(
            constant.googleapi.client_id, 
            constant.googleapi.client_secret, 
            `${ constant.base_url }/get-token`
        );

        oAuth2Client.setCredentials(JSON.parse(token));
        return Promise.resolve(google.drive({version: 'v3', auth: oAuth2Client}));
    },

    get_folders(token) {
        return this.get_drive_object(token)
            .then(drive => {
                return new Promise((resolve, reject) => {
                        drive.files.list({
                            pageSize: 1000,
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
                folders.sort((a, b) => {
                    return a.path < b.path ? -1 : 1;
                });
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

    get_files(token, folder_id, text = '', is_contained = 0) {
        return this.get_drive_object(token)
            .then(drive => {
                let query = `mimeType != 'application/vnd.google-apps.folder' and ('${folder_id}' in parents)`;
                if (text) {
                    query += `  and (${ is_contained ? '' : 'not' } fullText contains '${ text }')`
                }
                return new Promise((resolve, reject) => {
                        drive.files.list({
                            pageSize: 1000,
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

    move_file(token, file_id, from_folder_id, to_folder_id) {
        return this.get_drive_object(token)
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