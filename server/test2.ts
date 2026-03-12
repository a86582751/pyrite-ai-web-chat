import { Database } from 'bun:sqlite'
import { v4 as uuidv4 } from 'uuid'

const db = new Database(':memory:')
console.log('OK', uuidv4())
