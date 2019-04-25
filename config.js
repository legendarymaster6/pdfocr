module.exports = {
    db: {
        database: 'pdfocr',
        username: 'root',
        password: 'root',
        host: '127.0.0.1',
        dialect: 'mysql',
        logging: false,
        timezone: 'System',
        define: {
            underscored: true,
            timestamps: false
        }
    },
    servers: {
        dispenserd: '127.0.0.1'
    }
}
