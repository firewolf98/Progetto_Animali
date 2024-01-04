import express from 'express';
import bodyParser from 'body-parser';
import alimentiRoutes from './routes/alimentiRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use('/', alimentiRoutes); 

app.listen(PORT, () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
});
