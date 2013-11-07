(function (){

require.config({
    baseUrl: "/js",
    paths: {
    },
    waitSeconds: 0.1
})

function ExampleButtonHandler(router){
    var self = this
    self.router = router

    self.bind_clicks = function (divid){
        $('#'+divid).click(function (){
            router.route({rk: divid})
        })
    }
    self.bind_alerts = function (divid){
        router.subscribe(divid, function (msg){
            $('#'+divid+'_click').toggleClass('invisible')
        })}
    var btns = ['alert1', 'alert2']
    
    _.each(btns, self.bind_alerts) // subscribe alerts to received events
    _.each(btns, self.bind_clicks) // send events on button click
}

require(['router'], function (router){
    console.log('start')
    $(document).ready(function (){
        return new ExampleButtonHandler(router)
    })
})

}())