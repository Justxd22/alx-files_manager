import express from 'express';
import { promisify } from 'util';

const HOST = '0.0.0.0';
const PORT = process.env.PORT || '5000';
const app = express();



app.listen(PORT, HOST, () => {
    console.log(`Server is live at ${HOST}:${PORT}`);
});
