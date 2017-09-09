var utils = require('../../utils/utils.js');
var app = getApp();

Page({

  data: {
    hotList: {},
    bgColor: '#000',
    listenNum: 0,
    loadAnimate: true

  },

  onLoad: function (options) {
    var id = options.id;
    var that = this;
    utils.hotSong(id, function (res) {
      var str = res.data;
      var result = str.substring(str.indexOf("(") + 1, str.lastIndexOf(")"));
      var data = JSON.parse(result).cdlist[0];
      that.setData({
        hotList: data,
        listenNum: utils.listenNum(data.visitnum)
      })
      that.getBgColor(data.logo);
    })
  },

  //背景颜色
  getBgColor: function (p_url) {
    var that = this;
    utils.bgColor(p_url, function (res) {
      var str = res.data;
      var result = str.substring(str.indexOf("(") + 1, str.lastIndexOf(")"));
      var data = JSON.parse(result);
      var color = '#000';
      if (data.magic_color == 0) {
        color = '#000';
      } else {
        color = '#' + data.magic_color.toString(16);
      }

      that.setData({
        bgColor: color,
        loadAnimate: false
      })
    })
  },

  //跳转到播放音乐页面
  onPlayMusic: function (ev) {
    var idx = ev.currentTarget.dataset.idx;

    var obj = {
      playingData: this.data.hotList.songlist,
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