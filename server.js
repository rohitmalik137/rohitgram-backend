const app = require('./app');

const port = process.env.PORT || 7000;

const server = app.listen(port, () => {
  console.log(`Server started on PORT ${port}`);
});

const io = require('./socket').init(server);
io.on('connection', (socket) => {});
