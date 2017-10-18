var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var stationSchema = new Schema({
    station_id: { //1호선_서울역
        type: String,
        trim: true,
        require: true,
        unique: true
    },
    name: { //서울역
        type: String,
        require: true
    },
    line: { //1호선
        type: String,
        require: true
    },
    stuff_count: {
      type: Number,
      default: 0
    }
    // location 형식에 맞게 추가
});

mongoose.model('Station', stationSchema);
