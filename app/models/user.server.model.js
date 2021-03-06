var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var UserSchema = new Schema({
    uid: {
        type: String,
        unique: true,
        require: true
    },
    name: {
        type: String,
        trim: true,
    	default :""
    },
    phoneNum: {
        type: String,
        trim: true,
	default: ""
    },
    join_date: {
        type: Date,
        default: Date.now
    },
    email: {
        type: String,
	default:""
    },
    userToken: {
        type: String,
	default:""
    },
    photoURL: {
        type: String,
	default :""
    },
	keywords : {
		type : Array
	},
  keeping : { //담아두기
    type : Array
  },
  point : {
    type : Number,
    default: 300000
  },
	storeReviews : {
		type : Array
	}
}, {versionKey: false});

//UserSchema.set('toJSON',{ getters : true }); get함수 필요할 때
mongoose.model('User', UserSchema);
