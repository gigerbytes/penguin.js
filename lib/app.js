'use strict'

const express = require('express')
const bodyParser = require('body-parser').json

module.exports = createApp

function createApp ({ viewDriver, databaseDriver }) {
  const app = express()
  app.use('/static', viewDriver.static)
  app.use(/^\/(objects|pages)\/([^/]+).json$/, (req, res, next) => {
    const path = req.params[0] + '/' + req.params[1]
    viewDriver.meta({ params: { path } }).then(o => res.send(o), next)
  })
  app.put('/:language.json', bodyParser(), (req, res, next) => {
    const { language } = req.params
    databaseDriver.saveGlobals(req.body, { language })
      .then(() => res.send(req.body), next)
  })
  app.put('/:language/:name.json', bodyParser(), (req, res, next) => {
    const { name } = req.params
    const language =
      req.params.language === 'not_localized' ? null : req.params.language
    databaseDriver.savePageLocals(req.body, { language, name })
      .then(() => res.send(req.body), next)
  })
  app.put('/:language/:type/:id.json', bodyParser(), (req, res, next) => {
    const { type, id } = req.params
    const language =
      req.params.language === 'not_localized' ? null : req.params.language
    databaseDriver.saveObjectLocals(req.body, { language, type, id })
      .then(() => res.send(req.body), next)
  })
  app.get('/:language/:name.json', (req, res, next) => {
    const { language, name } = req.params
    Promise.all([
      databaseDriver.getPageLocals({ language, name }),
      databaseDriver.getPageLocals({ language: null, name }),
      databaseDriver.getGlobals({ language }),
      databaseDriver.getGlobals({ language: null })
    ])
    .then(fields => {
      res.send(Object.assign({}, ...fields))
    })
  })
  app.get('/:language/:type/:id.json', (req, res, next) => {
    const { language, type, id } = req.params
    Promise.all([
      databaseDriver.getObjectLocals({ language, type, id }),
      databaseDriver.getObjectLocals({ language: null, type, id }),
      databaseDriver.getGlobals({ language }),
      databaseDriver.getGlobals({ language: null })
    ])
    .then(fields => {
      res.send(Object.assign({}, ...fields))
    })
  })
  app.get('/', (req, res, next) => viewDriver.index(res, next))
  app.get('/:language/:page?', (req, res, next) => {
    const { params } = req
    viewDriver.page({ params }, res, next)
  })
  app.get('/:language/:type/:id', (req, res, next) => {
    const { params } = req
    viewDriver.object({ databaseDriver, params }, res, next)
  })
  return app
}
