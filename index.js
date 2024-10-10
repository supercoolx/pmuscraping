require('dotenv').config();
const express = require('express');
const app = express();
const logger = require('./helper/logger');
const path = require('path');

// database
const connectDB = require('./db/connect');

//  routers
const userRouter = require('./routes/userRoutes');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/', userRouter);

const port = process.env.PORT || 6002;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    app.listen(port, () =>
      logger.info(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    logger.error(error);
  }
};

start();
