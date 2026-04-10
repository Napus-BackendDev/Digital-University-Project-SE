'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objsSchema = new Schema({

    title           : [{
        key            : {type: String, default: null},
        value          : {type: String, default: null},
    }],
    create          : {
        by              : {type: mongoose.Schema.Types.ObjectId, ref: 'Users'},
        datetime        : {type: Date, default: Date.now}
    },

});
module.exports = mongoose.model('Setting_Collaborator', objsSchema, 'Setting_Collaborator');
