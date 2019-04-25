#!/usr/bin/env node
require('../common');

const fs = require('fs');
const moment = require('moment-timezone');
const q = require('q');
const request = require('request-promise');
const config = require('../config');

var worker = {

    consume() {
        var work = () => {
            request
                .post({
                    url: 'http://' + config.servers.dispenserd + ':8282/receive_block',
                    body: JSON.stringify({
                        lane: process.argv[3] || dispenserd.lane_main
                    }),
                    resolveWithFullResponse: true,
                    simple: false
                })
                .then(res => {
                    var body = JSON.parse(res.body);

                    if (!body) {
                        setTimeout(work, 0);
                        return null;
                    }

                    //console.log('running: ' + body.message);

                    var payload = JSON.parse(body.message);

                    worker[payload.job](payload, () => {
                        setTimeout(work, 0);
                    });
                })
                .catch(err => {
                    console.log(err);
                    console.log('dispenserd request error, trying again in 10 seconds');
                    setTimeout(work, 10000);
                });
        };

        console.log('dispenserd consumer online');
        work();
    },

    categorization(payload, done) {
        var incoming_folder, output_folder;
        var incoming_id, output_id;
        var token;
        var user;

        console.log('categorization');
        console.log('user_id = ' + payload.user_id);
        return db.users.find_one({
                where: {
                    user_id: payload.user_id
                }
            })
            .then(user_data => {
                user = user_data;
                token = user.google_token;
                if (!token) {
                    throw null;
                }
                return [
                    google_drive_api.get_folders(token),
                    db.rules.find_all({
                        where: {
                            user_id: user.user_id
                        },
                        order: ['index']
                    })
                ]
            })
            .spread((folders, rules) => {
                incoming_folder = user.input_folder;
                output_folder = user.output_folder;
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
                done();
            })
            .catch(err => {
                console.log(err);
                done();
            })
    }
};

switch (process.argv[2]) {
case '--consume':
    worker.consume();
    break;

default:
    console.log('command not found');
}
