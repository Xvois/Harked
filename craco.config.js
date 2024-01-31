const path = require('path');
module.exports = {
    webpack: {
        alias: {
            'tools': path.resolve(__dirname, 'src/tools/'),
            'API': path.resolve(__dirname, 'src/API/'),
            'components': path.resolve(__dirname, 'src/components/'),
        },
    },
};