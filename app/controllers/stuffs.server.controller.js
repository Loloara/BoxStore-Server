var Stuff = require('mongoose').model('Stuff');
var Seller = require('mongoose').model('User');
var Station = require('mongoose').model('Station');
var fcmPush = require('../apis/fcm_push');
var Keyword = require('mongoose').model('Keyword');
var stations = require('./stations.server.controller');
var trades = require('./trades.server.controller');

var hide_id = {_id: 0};
var stationFilter = {_id: 0, stuffCount: 0};
var stuffFilter = {negotiation: 0, receipt: 0};

//seller_id: User.uid, stationLine: Station.stationLine, stationName: Station.stationName
exports.create = function(req, res, next) {
  var reqStationName = req.body.stationName;
  reqStationName = reqStationName.trim();
  if(reqStationName[reqStationName.length-1] != "역"){
    reqStationName = reqStationName + "역";
  }
  Station.findOne({stationName: reqStationName})
    .exec(function(err, station){
      if(err) res.json(err);
      if(station == null){
        res.status(205).json({
            "result" : "NULL",
            "message" : "Does not exist"
        });
        return;
      }
      Seller.findOne({uid: req.body.sellerId})
        .exec(function(err, seller){
            if(err) {
              res.status(500).json({
                "result" : "ERR",
                "message": err
              });
              return;
            }
            var stuff = new Stuff(req.body);
            stuff.sellerId = seller._id;
            stuff.stationId = station._id;
	    if(stuff.imageUrl.length == 0){
		stuff.imageUrl.push('http://52.78.22.122:3000/빈이미지.png');
	    }
            stuff.save(function(err) {
                if (err) {
                    res.status(500).json({
                        "result": "ERR",
                        "message": err
                    });
                    return;
                } else {
                    stations.addCount(station._id);
					var keyword = stuff.stuffName;
					var keyword_trim = keyword.replace(/\s/g,"");
					Keyword.find({name : {$in:[keyword,keyword_trim]}},function(err,result){
						// console.log(result);


						if(err){

						}
						else if(result && result.length > 0){
							for(var idx in result){
								var users = result[idx].users;
								for(var i=0;i<users.length;i++){
									console.log(users[i]);
									var data ={
										dest : "dQ0zD8wFN0Q:APA91bHmWJ5G1_U8YiVxl5BqUBjkA8ypwR7WRYDnyG0LEyTx9WuQCWfyTZF09VmcNCFytKBGl9FmNJW9jcrHV3ZhWAJtlAGrKej6fHpv8l9Ygr2c5XO6lfyvb6fh8OVYcCIWzbunkt5G",
										type : "push",
										keyword :result[idx].name
									};
									fcmPush.sendMessage(data);
								}
							}
							// var data ={
							// 	dest: result.
							// 	type:
							// 	keywor:
							// }
							// fcmPush
						}
					});
                    res.json({
                        "result": "SUCCESS",
                        "message": "등록 성공"
                    });
                }
            });
        });
    });
};

exports.list = function(req, res) {
    console.log(req.params.category);
	var category = req.params.category;
	category =category.replace(/\./g,"/");
    Stuff.find({
      category : category
    })
    .populate('sellerId', hide_id)
    .populate('stationId', stationFilter)
    .exec(function(err, stuffs) {
        if (err) {
            res.status(500).json({
                "result": "ERR",
                "message": err
            });
            return;
        } else {
            res.json({
              "result" : "SUCCESS",
              "stuffs":stuffs
            });
        }
    });
};

exports.info = function(req, res) {
    Stuff.find({
      _id : req.params.stuffId
    })
    .select(hide_id)
    .populate('sellerId', hide_id)
    .populate('stationId', stationFilter)
    .exec(function(err, stuffs) {
        if (err) {
            res.status(500).json({
                "result": "ERR",
                "message": err
            });
            return;
        } else {
            res.json({
              "result": "SUCCESS",
              "stuffs" : stuffs
            });
        }
    });
};

//get '/stuffs/negotiation/:stuffId'
exports.getNegotiation = function(req, res){
  Stuff.findById(req.params.stuffId)
    .populate('negotiation.stationId', stationFilter)
    .exec(function(err, stuff){
      if(err){
        res.status(500).json({
            "result": "ERR",
            "message": err
        });
        return;
      }else{
        if(stuff.negotiation.done == "None"){
          res.json({
            "result": "None",
            "message": "Negotiation does not exist."
          });
        }else{
            res.json(stuff.negotiation);
        }
      }
    });
};

//put '/stuffs/negotiation/:stuffId'
exports.requestNegotiation = function(req, res){
  Stuff.findById(req.params.stuffId)
  .exec(function(err, stuff) {
      if (err) {
          res.status(500).json({
              "result": "ERR",
              "message": err
          });
          return;
      } else {
          var reqStationName = req.body.stationName;
          reqStationName = reqStationName.trim();
          if(reqStationName[reqStationName.length-1] != "역"){
            reqStationName = reqStationName + "역";
          }
          Station.findOne({stationName : reqStationName})
            .exec(function(err, station){
                if(err) res.json(err);
                if(station == null){
                  res.status(205).json({
                      "result" : "NULL",
                      "message" : "Does not exist"
                  });
                  return;
                }
                stuff.negotiation.stationId = station._id;
                stuff.negotiation.price = req.body.price;
                stuff.negotiation.done = 'Request';
                stuff.transactionStatus = 'Selling';
                stuff.save(function(err){
                  if(err){
                    res.status(500).json({
                        "result": "ERR",
                        "message": err
                    });
                    return;
                  }else{
                    res.json({
                      "result":"SUCCESS",
                      "message":'Request Negotiation'
                    });
                  }
                });
            });
      }
  });
};

//put '/stuffs/negotiation/confirm/:stuffId/:buyerId'
exports.confirmNegotiation = function(req, res){
  Stuff.findById(req.params.stuffId)
    .exec(function(err, stuff){
      if(err){
        res.status(500).json({
            "result" : "ERR",
            "message" : err
        });
        return;
      }
      Seller.findOne({uid : req.params.buyerId})
        .exec(function(err, user){
          var result = true;
          if(stuff.negotiation.price > user.point) result = false;
          var deal = {
            stuffId: stuff._id,
            sellerId: stuff.sellerId,
            buyerId: user._id,
            point: stuff.negotiation.price
          };
          if(result){
            trades.create(deal);
            stuff.negotiation.done = 'Done';
            stuff.save(function(err){
              if(err){
                res.status(500).json({
                    "result" : "ERR",
                    "message" : err
                });
                return;
              }else{
                  res.json({
                      "result" : "SUCCESS",
                      "message" : "Confirm Negotiation"
                  });
              }
            });
          }else{
            res.json({
              "result" : "FAILURE",
              "message" : "Not enough point"
            });
          }
        });
    });
};

//get '/stuffs/receipt/:stuffId'
exports.getReceipt =function(req, res){
  Stuff.findById(req.params.stuffId)
    .populate('receipt.stationId', stationFilter)
    .exec(function(err, stuff){
      if(err){
        res.status(500).json({
            "result" : "ERR",
            "message" : err
        });
        return;
      }else{
        if(stuff.receipt.done == "None"){
          res.json({
            "result": "None",
            "message": "Negotiation does not exist."
          });
        }else{
          res.json(stuff.receipt);
        }
      }
    });
};

//put '/stuffs/receipt/:stuffId'
exports.requestReceipt = function(req, res){
  Stuff.findById(req.params.stuffId)
    .exec(function(err, stuff){
      if(err){
        res.status(500).json({
          "result" : "ERR",
          "message" : err
        });
        return;
      }else{
        var reqStationName = req.body.stationName;
        reqStationName = reqStationName.trim();
        if(reqStationName[reqStationName.length-1] != "역"){
          reqStationName = reqStationName + "역";
        }
        Station.findOne({stationName : reqStationName})
          .exec(function(err, station){
            if(err) res.json(err);
            if(station == null){
              res.status(205).json({
                  "result" : "NULL",
                  "message" : "Does not exist"
              });
              return;
            }
            stuff.receipt = req.body;
            stuff.receipt.stationId = station._id;
            stuff.receipt.done = 'Request';
            stuff.save(function(err){
              if(err){
                res.status(500).json({
                  "result" : "ERR",
                  "message" : err
                });
                return;
              }else{
                res.json({
                  "result" : "SUCCESS",
                  "message" : "Request Receipt"
                });
              }
            })
          });
      }
    });
};

//put '/stuffs/receipt/confirm/:stuffId'
exports.confirmReceipt = function(req, res){
  Stuff.findById(req.params.stuffId)
    .exec(function(err, stuff){
      if(err){
        res.status(500).json({
            "result" : "ERR",
            "message" : err
        });
        return;
      }else{
        trades.success(stuff._id);
        stuff.price = stuff.negotiation.price;
        stuff.receipt.done = 'Done';
        stuff.transactionStatus = 'Sold';
        stuff.save(function(err){
          if(err){
            res.status(500).json({
                "result" : "ERR",
                "message" : err
            });
            return;
          }else{
              res.json({
                  "result" : "SUCCESS",
                  "message" : "Transaction Done"
              });
          }
        });
      }
    });
};

//get '/stuffs/lately/:stationName'
exports.latelyInfo = function(req, res){
  var reqStationName = req.params.stationName;
  reqStationName = reqStationName.trim();
  if(reqStationName[reqStationName.length-1] != "역"){
    reqStationName = reqStationName + "역";
  }
  Station.findOne({stationName : reqStationName})
    .exec(function(err, station){
      if(station==null){
        res.status(404).json({
            "result": "ERR",
            "message": "Does not exist"
        });
        return;
      }
      Stuff.find({ stationId : station._id})
        .sort({createdDate : -1})
        .select(stuffFilter)
        .populate('sellerId', hide_id)
        .populate('stationId', stationFilter)
        .exec(function(err, stuffs) {
          if(err){
            res.status(500).json({
                "result": "ERR",
                "message": err
            });
            return;
          }else{
            res.json({
              "result":"SUCCESS",
              "stuffs":stuffs
            });
          }
        });
    });
};

//get '/stuffs/latelyAll'
exports.latelyInfoAll = function(req, res){
  Stuff.find()
    .sort({createdDate : -1})
    .select(stuffFilter)
    .populate('sellerId', hide_id)
    .populate('stationId', stationFilter)
    .exec(function(err, stuffs) {
      if(err){
        res.status(500).json({
            "result": "ERR",
            "message": err
        });
        return;
      }else{
        res.json({
          "result":"SUCCESS",
          "stuffs":stuffs
        });
      }
    });
};
exports.searchByWord = function(req,res){
	var word = req.params.word;
	Stuff.find({
		"stuffName" : {$regex : ".*"+word+".*"}
	},function(err,result){
		if(err){
			res.status(500).json({
				"result": "ERR",
				"message": err
			});
      return;
		}else{
      if(result==null){
        res.status(404).json({
          "result":"NULL",
          "message":"Does not exist"
        });
        return;
      }
			res.json({
			  "result":"SUCCESS",
			  "stuffs": result
			});
		}
	});
};
