import express from 'express';
import routes from './routes/index';

const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());
app.use('/', routes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
