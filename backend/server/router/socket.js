module.exports = function (io) {


    io.on('connection', function (socket) {

        socket.on('disconnect', () => {

        });
        socket.on('my message', (msg) => {

            io.emit('my broadcast', `server: ${msg}`);
        });

        //
        // socket.on('message', async function (message) {

        //
        //

        // });
        //
        // socket.on('campus', async function (message) {
        //     var querys = {};
        //     const doc = await Setting_Campus.onQuerys(querys);
        //     socket.emit('campus', doc);
        // });
        //

        // socket.on('disconnect', () => {

        // });

    });
};

