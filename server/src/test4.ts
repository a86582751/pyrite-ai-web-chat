import { DatabaseManager } from './db/index'
import { Database } from 'bun:sqlite'
console.log('imports OK')
const db = new DatabaseManager()
console.log('db created')
