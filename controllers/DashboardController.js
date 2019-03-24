'use strict';
const q = require('q');
const fs = require('fs');
const { google } = require('googleapis');
const readline = require('readline');
const TOKEN_PATH = '../google_api/token.json';

module.exports = {
    home(req, res) {
        return q.fcall(() => {})
            .then(() => {
                return [
                    db.systemconfigs.find_one({
                        where: {
                            ref_id: constant.systemconfigs.ref_id.token,
                        }
                    })
                ]
            })
            .spread((token) => {                
                return res
                .render('dashboard/home', {
                    has_token: token ? true : false
                });
            })
            .catch(err => {
                console.log(err);
                return res.redirect('/');
            });
    },

    authorize(req, res) {
        const credentials = JSON.parse(fs.readFileSync('google_api/credentials.json'));
        const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[1]);
      
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
          });

        return res.redirect(authUrl);
    },

    get_token(req, res) {
        let { code, scope } = req.query;

        return db.systemconfigs.find_or_create({
                where: {
                    ref_id: constant.systemconfigs.ref_id.token,
                },
                defaults: {
                    value: code
                }
            })
            .spread((systemconfig, created) => {
                if (created) return null;
                systemconfig.value = code;
                return systemconfig.save();
            })
            .then(() => {
                return res.redirect('/');
            })
            .catch(err => {
                console.log(err);
                return res.redirect('/');
            });
    },

    list_files(req, res) {
        const credentials = JSON.parse(fs.readFileSync('google_api/credentials.json'));
        const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[1]);
    
        var token, client;
        return db.systemconfigs.find_one({
                where: {
                    ref_id: constant.systemconfigs.ref_id.token,
                }
            })
            .then(systemconfig => {
                token = systemconfig.value;
                oAuth2Client.setCredentials(JSON.parse(token));
            })
    }
}
