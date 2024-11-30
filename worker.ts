import {$Database, teenyHono, $Env} from "teenybase/worker";
import config from './migrations/config.json'
import {honoJSXAppSSR} from "./hono-jsx-ssr/app";

export interface Env {
  Bindings: $Env['Bindings'] & {
    PRIMARY_DB: D1Database;
    PRIMARY_R2?: R2Bucket;
  },
  Variables: $Env['Variables']
}

const app = teenyHono<Env>((c)=> new $Database(c, config, c.env.PRIMARY_DB, c.env.PRIMARY_R2))

// app.get('/', async (c) => {
//   const db = c.get('$db')
//   console.log(db)
//   return c.json({hello: 'world'})
// })

app.route('/', honoJSXAppSSR)

export default app
