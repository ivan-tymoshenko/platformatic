'use strict'

const { clear, connInfo, isSQLite } = require('./helper')
const { test } = require('tap')
const sqlGraphQL = require('..')
const sqlMapper = require('@platformatic/sql-mapper')
const fastify = require('fastify')

async function createBasicPages (db, sql) {
  if (isSQLite) {
    await db.query(sql`CREATE TABLE pages (
      id INTEGER PRIMARY KEY,
      title VARCHAR(42)
    );`)
    await db.query(sql`CREATE TABLE categories (
      id INTEGER PRIMARY KEY,
      name VARCHAR(42)
    );`)
  } else {
    await db.query(sql`CREATE TABLE pages (
      id SERIAL PRIMARY KEY,
      title VARCHAR(42)
    );`)
    await db.query(sql`CREATE TABLE categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(42)
    );`)
  }
}

test('ignore a table', async ({ pass, teardown, equal }) => {
  const app = fastify()
  app.register(sqlMapper, {
    ...connInfo,
    ignore: {
      categories: true
    },
    async onDatabaseLoad (db, sql) {
      pass('onDatabaseLoad called')

      await clear(db, sql)
      await createBasicPages(db, sql)
    }
  })
  app.register(sqlGraphQL)
  teardown(app.close.bind(app))

  await app.ready()

  {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      body: {
        query: `
          query {
            __schema {
              types {
                name
              }
            }
          }
        `
      }
    })
    equal(res.statusCode, 200, 'introspection query status code')
    const data = res.json().data
    equal(data.__schema.types.find((t) => t.name === 'Category'), undefined, 'Category type is ignored')
  }
})

test('ignore a column', async ({ pass, teardown, equal }) => {
  const app = fastify()
  app.register(sqlMapper, {
    ...connInfo,
    ignore: {
      categories: {
        name: true
      }
    },
    async onDatabaseLoad (db, sql) {
      pass('onDatabaseLoad called')

      await clear(db, sql)
      await createBasicPages(db, sql)
    }
  })
  app.register(sqlGraphQL)
  teardown(app.close.bind(app))

  await app.ready()

  {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      body: {
        query: `
          query {
            __schema {
              types {
                name
                fields {
                  name
                }
              }
            }
          }
        `
      }
    })
    equal(res.statusCode, 200, 'introspection query status code')
    const data = res.json().data
    const Category = data.__schema.types.find((t) => t.name === 'Category')
    equal(Category.fields.find((f) => f.name === 'name'), undefined, 'name column is ignored')
  }
})

test('ignore a table via sql-graphql option', async ({ pass, teardown, equal }) => {
  const app = fastify()
  app.register(sqlMapper, {
    ...connInfo,
    async onDatabaseLoad (db, sql) {
      pass('onDatabaseLoad called')

      await clear(db, sql)
      await createBasicPages(db, sql)
    }
  })
  app.register(sqlGraphQL, {
    ignore: {
      category: true
    }
  })
  teardown(app.close.bind(app))

  await app.ready()

  {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      body: {
        query: `
          query {
            __schema {
              types {
                name
              }
            }
          }
        `
      }
    })
    equal(res.statusCode, 200, 'introspection query status code')
    const data = res.json().data
    equal(data.__schema.types.find((t) => t.name === 'Category'), undefined, 'Category type is ignored')
  }
})

test('show a warning if there is no ignored entity', async ({ plan, pass, teardown }) => {
  plan(2)

  const app = fastify({
    logger: {
      info () {},
      debug () {},
      trace () {},
      fatal () {},
      error () {},
      child () {
        return this
      },
      warn (msg) {
        if (msg === 'Ignored graphql entity "missingEntityPages" not found. Did you mean "page"?') {
          pass('warning message is shown')
        }
      }
    }
  })

  app.register(sqlMapper, {
    ...connInfo,
    async onDatabaseLoad (db, sql) {
      pass('onDatabaseLoad called')

      await clear(db, sql)
      await createBasicPages(db, sql)
    }
  })
  app.register(sqlGraphQL, {
    ignore: {
      missingEntityPages: true
    }
  })
  teardown(app.close.bind(app))

  await app.ready()
})

test('ignore a column via sql-graphql option', async ({ pass, teardown, equal }) => {
  const app = fastify()
  app.register(sqlMapper, {
    ...connInfo,
    async onDatabaseLoad (db, sql) {
      pass('onDatabaseLoad called')

      await clear(db, sql)
      await createBasicPages(db, sql)
    }
  })
  app.register(sqlGraphQL, {
    ignore: {
      category: {
        name: true
      }
    }
  })
  teardown(app.close.bind(app))

  await app.ready()

  {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      body: {
        query: `
          query {
            __schema {
              types {
                name
                fields {
                  name
                }
              }
            }
          }
        `
      }
    })
    equal(res.statusCode, 200, 'introspection query status code')
    const data = res.json().data
    const Category = data.__schema.types.find((t) => t.name === 'Category')
    equal(Category.fields.find((f) => f.name === 'name'), undefined, 'name column is ignored')
  }
})

test('show a warning if there is no ignored entity field', async ({ plan, pass, teardown }) => {
  plan(2)

  const app = fastify({
    logger: {
      info () {},
      debug () {},
      trace () {},
      fatal () {},
      error () {},
      child () {
        return this
      },
      warn (msg) {
        if (msg === 'Ignored graphql field "missingFieldName" not found in entity "category". Did you mean "name"?') {
          pass('warning message is shown')
        }
      }
    }
  })

  app.register(sqlMapper, {
    ...connInfo,
    async onDatabaseLoad (db, sql) {
      pass('onDatabaseLoad called')

      await clear(db, sql)
      await createBasicPages(db, sql)
    }
  })
  app.register(sqlGraphQL, {
    ignore: {
      category: {
        missingFieldName: true
      }
    }
  })
  teardown(app.close.bind(app))

  await app.ready()
})
