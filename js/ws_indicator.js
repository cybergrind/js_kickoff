(function(){

/* Show WS connection status via bootstrap glyphicons
 Just require this in your main.js and add element with id='ws_status'

 Eg:
  <div id='on_top_right'
         style='position: fixed;
         z-index: 2147483647;
         top: 55px;
         right: 10px;
         border: 0px;
         background-color: transparent;
         overflow: hidden;'>
      <div id='ws_status'></div>
*/

function WsIndicator(router){
    var self = this
    self.router = router
    self.div = $('#ws_status')
    self.div.addClass('glyphicon')
    self.div.css('font-size', '20px')

    self.on_opened = function (msg){
        console.log('opened')
        self.div.addClass('glyphicon-ok-sign')
        self.div.removeClass('glyphicon-refresh')
    }

    self.on_closed = function (msg){
        console.log('closed')
        self.div.addClass('glyphicon-refresh')
        self.div.removeClass('glyphicon-ok-sign')
    }

    router.subscribe('ws_opened', self.on_opened)
    router.subscribe('ws_closed', self.on_closed)
}

define (
    "ws_indicator", ["router"], function (router){
        return new WsIndicator(router)
    })
}())