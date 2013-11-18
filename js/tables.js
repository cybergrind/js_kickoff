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
    self.can_be_null = false
    self.glyph_block = '<span class="row-add glyphicon glyphicon-plus" style="cursor: pointer; font-size: 10px"/>'

    self.rows = []
    self.load_template = function (t_name, bind_name){
        require(['text!../templates/'+t_name],
                function (t){
                    self[bind_name] = _.template(t)
                    self.load_count += 1
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
        self.loaded.done(function (){
            self.table_header = self.h_tmpl(self)
            self.table_body =  self.b_tmpl(self)
            self.table = self.t_tmpl(self)
            div.empty()
            if (self.add_callback){
                self.add_row = self.glyph_block } else { self.add_row = '' }
            div.html('<div class="row"><span">'+self.name+'</span><span>&nbsp;</span>'+self.add_row+'</div>')
            div.append(self.table)
            self.div = div
            self.edit_clicks()
        })
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



    self.edit_clicks = function(){
        if (self.add_callback || self.del_callback || self.save_callback){
            $('table', self.div).click(self.on_click)
            if (self.add_callback){
                $('.row-add', self.div).click(self.on_add_row)
            }
        }
    }

    self.setup_edit = function (add_cb, del_cb, edit_cb) {
        self.add_callback = add_cb
        self.del_callback = del_cb
        self.save_callback = edit_cb
    }

    self.on_add_row = function (evt){
        $('#modal-add').remove()
        var modal_add = self.add_tmpl(new Row(self, self.columns, []))
        self.div.append(modal_add)
        $('button.btn-add', self.div).click(function (e){
            var arr = $('#add-form').serializeArray()
            var dct = {}
            _.each(arr, function (arr_row){
                dct[arr_row.name] = arr_row.value
            })
            self.add_callback(self.name, dct)
            $('#modal-add', self.div).modal('hide')
            setTimeout(function (){$('.modal-backdrop').remove()}, 500)
        })
        $('#modal-add').modal()

    }

    self.on_click = function (evt){
        if (!self.add_callback && !self.del_callback && !self.save_callback)
        { return false }
        row_idx = evt.target.parentNode.rowIndex - 1
        if (row_idx < 0 || row_idx == undefined || isNaN(row_idx)){
            console.log('Do not draw edit menu')
            return false }
        cell_idx = evt.target.cellIndexn
        console.log(evt)
        var t_row = $(evt.target.parentNode)

        self.e_bar_clean()
        self.e_bar = $(self.e_tmpl(self))
        var edit = function (e){
            $('#modal-edit').remove()
            var edit_row = self.rows[row_idx].on_edit(cell_idx)
            self.e_bar_clean()
            var modal_edit = self.edit_tmpl(edit_row)
            self.div.append(modal_edit)
            $('button.btn-save', self.div).click(function (e){
                var arr = $('#edit-form').serializeArray()
                var dct = {}
                _.each(arr, function (arr_row){
                    dct[arr_row.name] = arr_row.value
                })
                self.save_callback(self.name, dct)
                $('#modal-edit', self.div).modal('hide')
                setTimeout(function (){$('.modal-backdrop').remove()}, 500)
            })
            $('#modal-edit').modal()
        }
        var remove = function (e){
            $('#modal-delete').remove()
            var del_row = self.rows[row_idx].on_delete(cell_idx)
            self.e_bar_clean()
            var modal_del = self.del_tmpl(del_row)
            self.div.append(modal_del)
            $('button.btn-del', self.div).click(function (e){
                $('#modal-delete', self.div).modal('hide')
                setTimeout(function (){$('.modal-backdrop').remove()}, 500)
                self.del_callback(self.name, self.rows[row_idx].get_row_dict())}),
            $('#modal-delete').modal()
        }
        var ok = function (e){
            self.e_bar_clean()
        }

        $('#bar-edit', self.e_bar).click(edit)
        $('#bar-remove', self.e_bar).click(remove)
        $('#bar-ok', self.e_bar).click(ok)
        self.e_bar.css({position: 'fixed',
                        top: evt.clientY,
                        left: evt.clientX,
                        'z-index': 2147483647,
                        'font-size': '18px'
                       })
        var e_uniq = Math.random()
        self.e_bar.uniq  = e_uniq
        setTimeout(function (){ self.e_bar_clean(e_uniq) }, 3000)
        $('body').append(self.e_bar)
    }

    self.get_cell_text = function (cell) {
        return cell
    }

    self.row_as_string = function (row){
        return row[1]
    }
    self.get_ref_text = function (cell) {
        var f_rows = _.filter(self.data, function (x) { return x[0] == cell })
        if (f_rows.length > 0){
            return self.row_as_string(f_rows[0])
        } else if (self.can_be_null) {
            return 'NULL'
        } else {
            return 'ERROR: Cannot get '+cell }
    }

    self.get_ref_edit = function (){
        var defaults = []
        if (self.can_be_null){ defaults.push({value: null, text: 'NULL'})}

        var curr = _.map(self.data, function(row){ return {value: row[0],
                                                           text: self.row_as_string(row)}})
        return _.union(defaults, curr)
    }

    self.sort = function (row){
        return row.get_sort()
    }

    self.destroy = function (){
        $('table', self.div).unbind('click')
        $('.row-add', self.div).unbind('click')
        self.columns = null
        self.rows = null
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
    self.table = table


    self.get_row_dict = function (){
        var ret = {}
        _.each(_.zip(self.columns.columns, self.data),
               function (d){ ret[d[0].name] = d[1] })
        return ret
    }
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
        if (column.primary) {
            var hv = '<input type="hidden" name="'+column.name+'" value="'+data+'"/>'
            return $('<p/>').html(hv)}

        var ret = $('<div/>')
        var fg = $('<div/>', {class: 'form-inline'})

        var row_edit_id = 'new_cell_'+table.name+column.name

        var label = $('<label/>', {for: row_edit_id, class: 'col-sm-2 control-label'})
        label.text(column.name)


        var input_div = $('<div/>', {class: 'col-sm-4'})
        if (_.contains(['int', 'str'], column.type)){
            var input = $('<input/>', {id: row_edit_id, class: 'form-control',
                                       value: data, name: column.name})
        } else if (column.type == 'reference'){
            var refs = column.par[column.ref].get_ref_edit()
            var input = $('<select/>', {class: 'form-control', name: column.name})
            _.each(refs, function (ref){
                var option = $('<option/>', {'value': ref.value, text: ref.text,
                                             selected: data == ref.value})
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
        return self
    }
    self.on_delete = function (cell_idx){
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