const mongoose = require('mongoose');

const db = function () {
    return process.env.NODE_ENV === 'production'
        ? process.env.MONGO_URI
        : process.env.DATABASE_LOCAL;
};

const connectDB = async () => {
    const conn = await mongoose.connect(db(), {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
    });

    console.log(
        `MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold
    );
};
module.exports = connectDB;
