(function (){

// all websockets related stuff
// we send ws_opened and ws_closed when open/close connection
// reconnect on disconnects
// route messages data to global_scope
function WsHandler(router) {
    var self = this
    self.router = router
    var prefix = document.location.protocol == 'https:'? 'wss://' : 'ws://'
    self.ws_uri =  prefix+location.host+'/ws'
    // store for messages received when not connected
    self.msgs = []
    self.reconnectTimeout = 5000
    self.init = function (){
        console.log('Open connection')
        self.socket = new WebSocket(self.ws_uri)
        self.socket.onclose = self.connection_close

        self.socket.onopen = function (){
            self.socket.onmessage = self.on_message
            self.send = self.ws_send
            // send stored messages
            _.each(self.msgs, function(m){self.send(m)})
            self.msgs = []
            router.route({
                rk: 'ws_opened',
                status: 'ws_opened'
            })
        }
    }

    self.connection_close = function(){
        console.log("Connection closed. Go reconnect")
        router.route({
            rk: 'ws_closed',
            status: 'ws_closed'
        })
        setTimeout(self.init, self.reconnectTimeout)
    }

    self.on_message = function (event){
        try{
            var msg = JSON.parse(event.data)
        }catch(err){
            var msg = event.data
        }
        router.route(msg)
    }

    self.ws_send = function (msg){
        self.socket.send(JSON.stringify(msg))
    }
    // should be replaced when connected
    self.store_messages = function (txt){
        self.msgs.push(txt)
    }
    // this default send function
    self.push = function (msg){
        self.send(msg.msg)
    }
    self.send = self.store_messages
    self.router.subscribe('push', self.push)
    self.init();
}

define(["router"], function (router){
    return new WsHandler(router);
})


}())