(function (){

// Main entry point and point for interconnections
// Route all messages
// Store some global variables, defined in modules
function Router() {
    var self = this
    console.debug("Init router")
    self.route_table = {}
    
    // routing logic here, simple pub/sub
    self.route = function (msg){
        var rk = msg.rk
        if (_.has(self.route_table, rk)){
            _.each(self.route_table[rk], function(fun){fun(msg)})
        }
    }
    
    self.subscribe = function(rk, handler_function){
        if (!_.has(self.route_table, rk)){
            self.route_table[rk] = []
        }
        if (!_.contains(self.route_table[rk], handler_function)){
            self.route_table[rk].push(handler_function)
        }
    }
    
    self.unsubscribe = function(rk, handler_function){
        if (!_.has(self.route_table, rk)){
            return
        }
        self.route_table[rk] = _.without(self.route_table[rk],
                                         handler_function)
    }

    self.push = function (msg){
        self.route({rk: 'push', msg: msg})
    }
    
}

define("router", [], function () { return new Router() } )

}())