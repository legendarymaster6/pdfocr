const request = require('request-promise');
const config = require('../config');

module.exports = {

    lane_main: 'main',
    lane_pulls: 'pulls',

    job_categorization: 'categorization',

    /**
     * implementation
     *
     * dispenserd.schedule(dispenserd.job_test, {
     *     name: 'brian'
     * });
     */
    schedule(job, options) {
        options.job = job;

        request
            .post({
                url: 'http://' + config.servers.dispenserd + ':8282/schedule',
                body: JSON.stringify({
                    lane: options.lane || dispenserd.lane_main,
                    priority: options.priority || 10000,
                    message: JSON.stringify(options)
                }),
                resolveWithFullResponse: true,
                simple: false
            })
            .catch(err => {
                console.log('job failed to schedule');
            });
    }

};
