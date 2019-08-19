'use strict'

const EventEmitter = require('events')

const CODE = 'ECONNERROR'

class Socket extends EventEmitter {
  constructor() {
    super()
    this.listeners = Object.create(null)
  }

  connect(url) {
    this.url = url
    this._attachSocket(wx.connectSocket({
      url,
      header: {
        'content-type': 'application/json'
      },
      protocols: ['xmpp']
    }))
  }

  _attachSocket(socket) {
    const sock = (this.socket = socket)
    const {listeners} = this
    listeners.open = () => {
      this.emit('connect')
    }

    listeners.message = ({data}) => {
      this.emit('data', data)
    }

    listeners.error = event => {
      // WS
      let {error} = event
      // DOM
      if (!error) {
        error = new Error(`WebSocket ${CODE} ${this.url}`)
        error.errno = CODE
        error.code = CODE
      }

      error.event = event
      error.url = this.url
      this.emit('error', error)
    }

    listeners.close = event => {
      this._detachSocket()
      this.emit('close', !event.wasClean, event)
    }

    sock.onOpen(listeners.open)
    sock.onMessage(listeners.message)
    sock.onError(listeners.error)
    sock.onClose(listeners.close)
  }

  _detachSocket() {
    delete this.url
    const {socket, listeners} = this
    Object.getOwnPropertyNames(listeners).forEach(k => {
      delete listeners[k]
    })
    delete this.socket
  }

  end() {
    this.socket.close()
  }

  write(data, fn) {
    this.socket.send({
      data,
      success: () => fn(),
      fail: fn
    });
  }
}

module.exports = Socket
