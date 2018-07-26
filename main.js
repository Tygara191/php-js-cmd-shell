/**
 * main.js
 *
 * Main game code file
 *
 * @author  Vesko Nikolov <vesko626262@abv.bg>
 * @version 1.0
 * @since   10.09.2017
 */

jQuery.fn.rotate = function(degrees) {
    $(this).css({'transform' : 'rotate('+ degrees +'deg)'});
    return $(this);
};

var util = {
    getRandomColor: function() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },

    escapeHtml: function(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

function Debug(){
    var that = this;

    const TYPE_IN = "in";
    const TYPE_OUT = "out";

    this.last_cmd_id = 0;

    this.console_in = $("#console-in");
    this.console_form = $("#console-form");
    this.btn_hibernate = $("#hibernate");

    this._console_elem = $("#console-debug");

    this._addZ = function(n){
        return n<10? '0'+n:''+n;
    };

    this._print = function (text, type) {
        var cmd_id = this._next_cmd_id();
        var cmd_elem_id = this._cmd_elem_id(cmd_id);

        this._console_elem.append("<span id='"+cmd_elem_id+"'><strong class='cmd-id'>["+cmd_id+"]</strong><strong class='type-"+type+"'>["+type+"]</strong><strong class='timestamp'>["+this.getDebugTimestamp()+"]</strong> " + text + "</span>");
        this._console_elem.scrollTop(this._console_elem.prop("scrollHeight"));

        return cmd_id;
    };

    this.clear = function(){
        this._console_elem.html("");
    };

    this.makeVisualCommand = function (text, type) {
        return this._print(util.escapeHtml(text)+"<br />", type);
    };

    this.getDebugTimestamp = function () {
        var current_date = new Date();
        return this._addZ(current_date.getHours()) + ":" + this._addZ(current_date.getMinutes()) + ":" + this._addZ(current_date.getSeconds());
    };

    this._next_cmd_id = function () {
        this.last_cmd_id += 1;
        return this.last_cmd_id-1;
    };

    this._cmd_elem_id = function (cmd_id) {
        return "cmd-"+cmd_id;
    };

    this._get_cmd_elem = function(cmd_id){
        return $("#"+this._cmd_elem_id(cmd_id));
    };

    this._set_command_loading = function(cmd_id){
        var elem = this._get_cmd_elem(cmd_id);
        elem.css({
            opacity: 0.3
        });
        elem.children('.cmd-id').css({color: "#3e7bff"})
    };

    this._set_command_failed = function(cmd_id){
        var elem = this._get_cmd_elem(cmd_id);
        elem.animate({
            opacity: 1
        });
        elem.children('.cmd-id').css({color: "#ff0029"});
    };

    this._set_command_success = function(cmd_id){
        var elem = this._get_cmd_elem(cmd_id);
        elem.animate({
            opacity: 1
        });
        elem.children('.cmd-id').css({color: "#6eff13"});
    };

    this.try_command = function (cmd, callbacks) {
        var cmd_id = this.makeVisualCommand(cmd, TYPE_IN);

        if(typeof callbacks === "undefined"){
            callbacks = {
                started: function(cmd_id){},
                success: function(cmd_id, out){},
                error: function(cmd_id, error){}
            }
        }

        callbacks.started(cmd_id);
        that._set_command_loading(cmd_id);

        $.ajax({
            url: "backend.php",
            type: "POST",
            data: {"cmd": cmd},
            success: function(data) {
                if(data.status == "success"){
                    callbacks.success(cmd_id, data.out);

                    that._set_command_success(cmd_id);

                    for(key in data.out){
                        if(data.out.hasOwnProperty(key)){
                            that.makeVisualCommand(data.out[key], TYPE_OUT);
                        }
                    }
                }
                if(data.status == "error"){
                    that._set_command_failed(cmd_id);
                    that.makeVisualCommand(data.status_meta, TYPE_OUT);
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                that._set_command_failed(cmd_id);
                that.makeVisualCommand("Http error", TYPE_OUT);
            }
        });
    };

    this._form_submitted = function (event) {
        event.preventDefault();

        if(that.console_in.val()){
            var cmd = that.console_in.val();

            // Clear
            that.console_in.val("");

            that.try_command(cmd);
        }
    };

    this._hibernate_clicked = function (event) {
        that.try_command("shutdown -h");
    };

    // Listeners at the bottom
    this.console_form.on('submit', this._form_submitted);
    this.btn_hibernate.on('click', this._hibernate_clicked);
}

new Debug();