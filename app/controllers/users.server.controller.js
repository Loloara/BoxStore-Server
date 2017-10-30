var User = require('mongoose').model('User');
var request = require("request");
exports.create = function(req, res, next) {
    var user = new User(req.body);
    user.save(function(err) {
        if (err) {
            if (err.code == "11000") { // mongodb duplicate code
                res.status(500).json({
                    "result": "ERR",
                    "message": "id 중복"
                });
            } else {
                res.status(500).json({
                    "result": "ERR",
                    "message": "db 에러"
                });
            }
        } else {
            res.json({
                "result": "SUCCESS",
                "message": "회원가입 성공"
            });
        }
    });
};


exports.login = function(req, res) {
    var id = req.params.uid;
    User.findOne({
        uid: id
    },{
	"_id": false,
	"uid": true,
	"name": true,
	"phoneNum" : true,
	"email": true,
	"userToken": true,
	"photoURL": true
	}).lean().exec(function(err, result) {
        if (err) {
	            res.status(500).json({
        	        "result": "ERR",
                	"message": "db 에러"
	            });
        } else {
            if (result) {
                res.json({
                    "result": "SUCCESS",
                    "message": "로그인 성공",
                    "userInfo" : result
                });
            } else {
                res.status(404).json({
			"result": "ERR",
			"message": "로그인 실패"
		});
            }
        }
    });
};
exports.keywords_create = function(req,res){
	var id = req.body.uid;
	var keyword = req.body.keyword;
	var thisRes= res;
	var token = req.params.userToken;
	User.findOne({
		uid : id
	}).lean().exec(function(err,result){
		if(err){
			res.status(500).json({
				"result":"ERR",
				"message":"db에러"
			});
		}else if(result) {
			User.update({
				uid : id
			},{
				$addToSet: {keywords : keyword}
			},function(err,res){
				if(err){

				}else if(res){
					var options = {
					  uri: 'http://rlatjdwn9410.run.goorm.io/keywords',
					  method: 'POST',
					  json: {
						  "uid" : id,
						  "keyword" : keyword,
						  "userToken" : token
					  }
					};

					 request(options, function(err,result, body) {
						 console.log(body);
						 if(err){
							 thisRes.status(500).json({
								 "result" : "err",
								 "message" : "server error"
							 });
						 }else {
							 thisRes.json(body);
						 }
					 });
				}
			});
		}else {
			res.status(404).json({
				"result":"ERR",
				"message":"잘못된 유저아이디"
			});
		}
	});
};
exports.keywords_list = function(req,res){
	var id = req.params.uid;
	 User.findOne({
        uid: id
    },{
		"keywords" : true
	}).lean().exec(function(err, result) {
        if (err) {
	            res.status(500).json({
        	        "result": "ERR",
                	"message": "db 에러"
	            });
        } else {
            if (result) {
                res.json({
                    "result": "SUCCESS",
                    "message": "로그인 성공",
                    "keywordList" : result.keywords
                });
            } else {
                res.status(404).json({
			"result": "ERR",
			"message": "로그인 실패"
		});
            }
        }
    });
};

exports.keepStuff = function(req, res){
  
};
