import { $Database, $Env, OpenApiExtension, PocketUIExtension, teenyHono } from 'teenybase/worker';
import config from './migrations/config.json';
import { honoJSXAppSSR } from './hono-jsx-ssr/app';

export interface Env {
  Bindings: $Env['Bindings'] & {
    PRIMARY_DB: D1Database;
    PRIMARY_R2?: R2Bucket;
  },
  Variables: $Env['Variables']
}

const app = teenyHono<Env>(async (c)=> {
  const db = new $Database(c, config, c.env.PRIMARY_DB, c.env.PRIMARY_R2)
  db.extensions.push(new OpenApiExtension(db, true))
  db.extensions.push(new PocketUIExtension(db))
  // db.extensions.push(new PocketUIExtension(db, 'http://localhost:4173/'))

  // db.addEventListener('run_sql', (e)=>{
  //   console.log('Run SQL:', e)
  // })
  // db.addEventListener('run_sql_fail', (e)=>{
  //   console.log('Error SQL:', e)
  // })

  return db
}, undefined, {
  logger: false,
  cors: false,
})

app.route('/', honoJSXAppSSR)

export default app
