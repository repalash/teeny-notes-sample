import {$Database, $Env, OpenApiExtension, teenyHono, PocketUIExtension} from "teenybase/worker";
import config from './migrations/config.json'
import {honoJSXAppSSR} from "./hono-jsx-ssr/app";

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
  return db
}, undefined, {
  logger: false,
  cors: false,
})

app.route('/', honoJSXAppSSR)

export default app
