var utils = require('../../utils/utils.js');
var app = getApp();
Page({

  data: {
    song: {},
    specialColor: false,
    loadAnimate: true//加载中动画
  },

  onLoad: function (options) {
    var id = options.id;
    var that = this;
    var url = 'https://c.y.qq.com/v8/fcg-bin/fcg_v8_toplist_cp.fcg';
    utils.topReq(id, url, function (res) {

      var color = res.color == 0 ? '#000' : '#' + res.color.toString(16);
      if (color == '#e0e0e0') {
        that.setData({
          specialColor: true
        })
      }
      var obj = {
        songList: res.songlist,
        update_time: res.update_time,
        topinfo: res.topinfo,
        bgColor: color
      }
      that.setData({
        song: obj,
        loadAnimate: false //加载中动画        
      })
    })
  },



  //跳转到播放音乐页面
  onPlayMusic: function (ev) {
    var idx = ev.currentTarget.dataset.idx;

    var songData = [];
    var songlist = this.data.song.songList;
    for (var i = 0; i < songlist.length; i++) {
      songData.push(songlist[i].data)
    }

    var obj = {
      playingData: songData,
      indexs: idx,
      playing: true
    };
    
    app.globalData = obj;
    wx.setStorageSync('historyPlay', obj);

    wx.navigateTo({
      url: '../playMusic/playMusic'
    })
  }
})