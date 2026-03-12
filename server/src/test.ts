import { Database } from 'bun:sqlite'
console.log('Database imported:', typeof Database)
const db = new Database(':memory:')
console.log('Database created')
