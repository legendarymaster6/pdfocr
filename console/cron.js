#!/usr/bin/env node
require('../common');

const moment = require('moment');

var actions = {
    hourly_categorization() {
        let current_hour = moment().hour();
        let runs = [];
        for (let i = 1; i <= 3; i++) {
            if (current_hour % (24 / i) == 0) {
                runs.push(1);
            }
        }
        return db.users.find_all({
                where: {
                    runs_per_day: runs,
                }
            })
            .then(users => {
                for (let user of users) {
                    dispenserd.schedule(dispenserd.job_categorization, {
                        user_id: user.user_id
                    });
                }
            });
    }
};

var method = process.argv[2]
    .replace(/-/gi, '_')
    .replace(/^_+/gi, '');

actions[method]();
