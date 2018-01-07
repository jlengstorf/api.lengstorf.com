import Express from 'express';
import { configure, serve } from './lib/app';

const app = Express();

configure(app);
serve(app);
