(function(){

function Columns(columns){
    var self = this
    self.columns = columns

    self.names = _.map(self.columns,
                        function (x) { return x.name })
    return self
}

function Table(name, columns, data){
    var self = this
    self.name = name
    self.data = data
    self.columns = columns
    self.table_width = 'col-md-12'
    self.load_count = 0
    self.target_count = 0
    self.loaded = $.Deferred()
    self.div = null

    self.rows = []
    self.load_template = function (t_name, bind_name){
        require(['text!../templates/'+t_name],
                function (t){
                    self[bind_name] = _.template(t)
                    self.load_count += 1
                    console.log('LOAD COUNT: '+self.load_count)
                    if (self.load_count == self.target_count){
                        self.loaded.resolve()}
                })
    }
    self.target_count = 7
    self.load_template('table.html', 't_tmpl')
    self.load_template('table_header.html', 'h_tmpl')
    self.load_template('table_body.html', 'b_tmpl')
    self.load_template('table_edit_bar.html', 'e_tmpl')
    self.load_template('row_edit.html', 'edit_tmpl')
    self.load_template('row_delete.html', 'del_tmpl')
    self.load_template('row_add.html', 'add_tmpl')


    self.init = function (){
        self.rows = _.map(data, function (row){ return new Row(self, self.columns, row) })
    }
    self.draw = function (div){
        console.log('H_TMPL')
        console.log(self.loaded.state())
        console.log(self.h_tmpl)
        self.table_header = self.h_tmpl(self)
        self.table_body =  self.b_tmpl(self)
        self.table = self.t_tmpl(self)
        div.append('<div class="row"><span">'+self.name+'</span><span>&nbsp;</span><span class="row-add glyphicon glyphicon-plus" /></div>')
        div.append(self.table)
        $('table', div).click(self.on_click)
        $('.row-add', div).click(self.on_add_row)
        self.div = div
    }

    self.e_bar_clean = function (what){
        console.log('Call clear with '+what)
        if (! self.e_bar){ return }
        if (what && self.e_bar.uniq != what){
            return
        }
        if (what){
            $(self.e_bar).fadeOut()
            self.e_bar.promise().done(function (){
                if (self.e_bar){
                    self.e_bar.remove()
                    self.e_bar = null }})
        } else {
            self.e_bar.remove()
            self.e_bar = null
        }
    }

    self.on_add_row = function (evt){
        console.log('click row add')
        $('#modal-add').remove()
        var modal_add = self.add_tmpl(new Row(self, self.columns, []))
        self.div.append(modal_add)
        $('#modal-add').modal()
    }

    self.on_click = function (evt){
        row_idx = evt.target.parentNode.rowIndex - 1
        console.log('On table click. RowIndex '+row_idx)
        if (row_idx < 0 || row_idx == undefined || isNaN(row_idx)){
            console.log('Do not draw edit menu')
            return false }
        cell_idx = evt.target.cellIndexn
        console.log(evt)
        var t_row = $(evt.target.parentNode)

        self.e_bar_clean()
        self.e_bar = $(self.e_tmpl(self))
        var edit = function (e){
            console.log('click edit')
            $('#modal-edit').remove()
            var edit_row = self.rows[row_idx].on_edit(cell_idx)
            self.e_bar_clean()
            var modal_edit = self.edit_tmpl(edit_row)
            self.div.append(modal_edit)
            $('#modal-edit').modal()
        }
        var remove = function (e){
            console.log('click remove')
            $('#modal-delete').remove()
            var del_row = self.rows[row_idx].on_delete(cell_idx)
            self.e_bar_clean()
            var modal_del = self.del_tmpl(del_row)
            self.div.append(modal_del)
            $('#modal-delete').modal()
        }
        var ok = function (e){
            console.log('click ok')
            self.e_bar_clean()
        }

        $('#bar-edit', self.e_bar).click(edit)
        $('#bar-remove', self.e_bar).click(remove)
        $('#bar-ok', self.e_bar).click(ok)
        self.e_bar.css({position: 'fixed',
                        top: evt.pageY-5,
                        left: evt.pageX+10,
                        'z-index': 2147483647,
                        'font-size': '18px'
                       })
        var e_uniq = Math.random()
        self.e_bar.uniq  = e_uniq
        setTimeout(function (){ self.e_bar_clean(e_uniq) }, 3000)
        $('body').append(self.e_bar)
    }

    self.draw_cell_menu = function (evt, row){

    }

    self.get_cell_text = function (cell) {
        return cell
    }

    self.get_ref_text = function (cell) {
        var f_rows = _.filter(self.data, function (x) { return x[0] == cell })
        if (f_rows.length > 0){
            return f_rows[0][1]
        } else {
            return 'ERROR: Cannot get '+cell }
    }

    self.get_ref_edit = function (){
        return _.map(self.data, function(row){ return {value: row[0],
                                                       text: row[1]}})
    }

    self.sort = function (row){
        return row.get_sort()
    }
    self.init()
    return self
}

function Row(table, columns, row_data){
    var self = this
    self.columns = columns
    self.data = row_data
    self.attrs = ''
    self.attrs_cell = ''

    self.cell_getter = function (column, cell){
        if (!column){
            return 'Unknown column'
        } else if (_.contains(['int', 'str'], column.type)) {
            return cell
        } else if (column.type == 'reference') {
            return column.par[column.ref].get_ref_text(cell)
        } else {
            return cell
        }
    }
    self.get_cells = function (){
        return _.map(_.zip(self.columns.columns, self.data),
                     function (d){ return self.cell_getter(d[0], d[1])})
    }
    self.get_row_add = function (){
        return _.map(self.columns.columns,
                     function (column) { return self.get_edit_element(column, null)})
    }
    self.get_row_edit = function (){
        return _.map(_.zip(self.columns.columns, self.data),
                     function (d) { return self.get_edit_element(d[0], d[1])})
    }
    self.get_edit_element = function (column, data){
        if (!data && column.primary) { return $('')}
        //if (!data){ data = '' }
        var ret = $('<div/>')
        var fg = $('<div/>', {class: 'form-inline'})

        var row_edit_id = 'new_cell_'+table.name+column.name

        var label = $('<label/>', {for: row_edit_id, class: 'col-sm-2 control-label'})
        label.text(column.name)


        var input_div = $('<div/>', {class: 'col-sm-4'})
        if (_.contains(['int', 'str'], column.type)){
            var input = $('<input/>', {id: row_edit_id, class: 'form-control',
                                       value: data})
        } else if (column.type == 'reference'){
            var refs = column.par[column.ref].get_ref_edit()
            var input = $('<select/>', {class: 'form-control'})
            _.each(refs, function (ref){
                var option = $('<option/>', {'value': ref.value, text: ref.text})
                input.append(option)})
        }
        input_div.append(input)

        fg.append(label)
        fg.append(input_div)
        ret.append(fg)
        return ret
    }

    self.get_sort = function (){
        return self.data[0]
    }

    self.on_edit = function (cell_idx){
        console.log('EDIT ROW')
        console.log(JSON.stringify(self.data))
        console.log('Exact cell content: '+self.data[cell_idx])
        console.log('------------------------------')
        return self
    }
    self.on_delete = function (cell_idx){
        console.log('DELETE ROW')
        console.log(JSON.stringify(self.data))
        console.log('Exact cell content: '+self.data[cell_idx])
        console.log('------------------------------')
        content = self.data
        return self
    }

    return self
}


define(['tables'],
       function (){
           return {'Table': Table,
                   'Row': Row,
                   'Columns': Columns
                  }
       })
})()