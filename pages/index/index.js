var utils = require('../../utils/utils.js');
var app = getApp();

Page({

  data: {
    navList: ['推荐', '排行榜', '搜索'],
    navCur: 0,
    sHeight: 0,

    cancel: true,
    clearVal: false,
    val: '',
    page: 1,
    showSearch: false,
    over: false,//全部数据都加载完
    historyPanel: true,
    searchResultPanel: false,

    urlList: [
      'https://c.y.qq.com/musichall/fcgi-bin/fcg_yqqhomepagerecommend.fcg', //推荐
      'https://c.y.qq.com/v8/fcg-bin/fcg_myqq_toplist.fcg', //排行榜
      'https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg'  //搜索
    ],
    songImgUrl: 'http://y.gtimg.cn/music/photo_new/T002R150x150M000',
    songerImgUrl: 'https://y.gtimg.cn/music/photo_new/T001R68x68M000',

    recommend: {},
    ranKings: {},
    search: {},
    searchResult: {},
    historySearch: null,

    loadAnimate: true, //加载中动画
    searchLoading: false,

    playingData: [],
    key: 0,
    playing: false,
    playImg: '',
    position: 0,

    menuBtn: false,
    hideBottom: true,
    timer: null
  },

  onLoad: function () {
    this.getData();
    this.ongetHistory();  //获取搜索历史记录
    this.upPlayData();  //动态刷新歌单列表

    var that = this;
    //获取屏幕宽度
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          sHeight: res.windowHeight
        })
      }
    })
  },

  //tab切换
  navTap: function (ev) {
    var idx = ev.currentTarget.dataset.navidx;
    this.setData({
      navCur: idx,
      loadAnimate: true
    })
    this.getData();
  },
  
  //滑动tab
  onChangeNav: function (ev) {
    this.setData({
      navCur: ev.detail.current,
      loadAnimate: true
    })
    this.getData();
  },

  //获取数据
  getData: function () {
    var that = this;
    var idx = that.data.navCur;
    var url = that.data.urlList[idx];
    utils.dataReq(url, function (res) {
      switch (idx) {
        case 0: //推荐
          that.recommendData(res.data);
          break;
        case 1://排行榜
          that.ranKingsData(res.data);
          break;
        default://搜索
          var result = {
            hotkey: res.data.hotkey.splice(10, 10),//未处理完
            special_key: res.data.special_key
          }
          that.setData({
            search: result
          })
      }
      that.setData({
        loadAnimate: false
      });
    })
  },

  //推荐 数据
  recommendData: function (data) {
    for (var i = 0; i < data.songList.length; i++) {
      data.songList[i].accessnum = utils.listenNum(data.songList[i].accessnum);
    }

    var rem = {
      radioList: data.radioList,
      slider: data.slider,
      songList: data.songList
    };
    this.setData({
      recommend: rem,
      loadAnimate: false
    });
  },

  //排行榜 数据
  ranKingsData: function (data) {
    for (var i = 0; i < data.topList.length; i++) {
      data.topList[i].listenCount = utils.listenNum(data.topList[i].listenCount);
    }

    var rank = {
      topList: data.topList
    }
    this.setData({
      ranKings: rank
    })
  },

  //热门歌单跳转
  onHotSongs: function (ev) {
    var id = ev.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../hotList/hotList?id=' + id
    })
  },

  //获取焦点
  onFocus: function () {
    this.setData({
      cancel: false,
      showSearch: true
    })
  },

  //点击完成按钮时触发
  onConfirm: function (ev) {
    var val = ev.detail.value;
    if (!val) {
      this.onFocus();
      return;
    }

    this.setData({
      val: val
    })
    this.searchData();
  },

  //搜索
  searchData: function () {
    this.setData({
      page: 1,
      over: false,
      historyPanel: false,
      searchResultPanel: true,
      searchLoading: true
    })
    this.searchAdd();
    this.onsetHistory();
  },

  searchAdd: function () {
    var obj = {
      val: this.data.val,
      page: this.data.page
    }

    var that = this;
    utils.searchReq(obj, function (res) {

      var singer;
      var songs = res.data.song;
      if (songs.list.length == 0) {
        that.setData({
          over: true,
          searchLoading: false
        })
        wx.hideNavigationBarLoading();//停止加载
        return
      }

      if (that.data.page == 1) {
        singer = {
          song: songs,
          zhida: res.data.zhida
        }
      } else {
        songs.list = that.data.searchResult.song.list.concat(songs.list)
        singer = {
          song: songs,
          zhida: that.data.searchResult.zhida
        }
      }
      wx.hideNavigationBarLoading();//停止加载

      that.setData({
        searchResult: singer,
        searchLoading: false
      })
    })
  },

  //输入
  onInput: function (ev) {
    var val = ev.detail.value;
    if (val) {
      this.setData({
        clearVal: true
      })
    } else {
      this.setData({
        clearVal: false
      })
    }
  },

  //清空输入框
  onClear: function () {
    this.setData({
      val: '',
      searchResultPanel: false
    })
    this.ongetHistory();
  },

  //取消
  onCancel: function () {
    this.setData({
      cancel: true,
      val: '',
      showSearch: false,
      clearVal: false,
      searchResult: {},
      historyPanel: true,
      searchResultPanel: false
    })
  },

  //排行榜跳转到详情页
  onTopList: function (ev) {
    var id = ev.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../topList/topList?id=' + id
    })
  },

  //上拉加载
  onScrolltolower: function () {
    var that = this;
    clearTimeout(this.data.timer);
    this.data.timer = setTimeout(function () {
      if (that.data.showSearch && that.data.searchResultPanel && !that.data.historyPanel) {
        //console.log(1)
        var p = ++that.data.page;

        that.setData({
          page: p,
          searchLoading: true
        })
        wx.showNavigationBarLoading();
        that.searchAdd();
      }
    }, 50)
  },

  //上拉加载
  // onReachBottom: function () {
  //   if (this.data.over) return;//加载完毕
  //   if (this.data.navCur == 2) {
  //     var p = ++this.data.page;

  //     this.setData({
  //       page: p,
  //       searchLoading: true
  //     })
  //     wx.showNavigationBarLoading();
  //     this.searchAdd();
  //   }
  // },

  //设置历史记录
  onsetHistory: function () {
    var data = [];
    var obj = {
      content: this.data.val
    }
    if (!this.data.historySearch) {
      //无缓存数据
      data.push(obj);
    } else {
      var his = wx.getStorageSync('historySearch');
      for (var i = 0; i < his.length; i++) {
        //历史搜索重复
        if (obj.content == his[i].content) {
          his.splice(i, 1);
        }
      }
      his.unshift(obj);
      data = his;
    }

    wx.setStorageSync('historySearch', data);
  },

  //获取搜索历史记录
  ongetHistory: function () {
    var his = wx.getStorageSync('historySearch');
    if (his.length == 0) {
      this.setData({
        historyPanel: false,
        historySearch: null
      })
    } else {
      this.setData({
        historyPanel: true
      })
    }
    this.setData({
      historySearch: his
    })
  },

  //删除单条历史记录
  onRemoveHis: function (ev) {
    var key = 'historySearch';
    var idx = ev.currentTarget.dataset.idx;
    var his = wx.getStorageSync(key);
    his.splice(idx, 1);
    wx.setStorageSync(key, his);
    this.ongetHistory();
  },

  //删除全部历史记录
  onRemoveAll: function () {
    var key = 'historySearch';
    wx.removeStorageSync(key);
    this.setData({
      historyPanel: false,
      historySearch: null
    })
  },

  //热门词搜索
  onHotSearch: function (ev) {
    var val = ev.currentTarget.dataset.word;
    this.setData({
      val: val,
      showSearch: true,
      clearVal: true,
      cancel: false
    })
    this.searchData();
  },

  //搜索结果播放音乐
  onPlayMusic: function (ev) {
    var idx = ev.currentTarget.dataset.idx;

    var obj = {
      playingData: this.data.searchResult.song.list,
      indexs: idx,
      playing: true
    };
    app.globalData = obj;
    wx.setStorageSync('historyPlay', obj);

    wx.navigateTo({
      url: '../playMusic/playMusic'
    })
  },

  //底部歌单显示隐藏
  onMenu: function () {
    var status = !this.data.menuBtn;
    this.setData({
      menuBtn: status
    })
  },

  //底部播放控制
  onPlayBtn: function () {
    var playing = !this.data.playing;
    app.globalData.playing = playing;
    this.setData({
      playing: playing
    })
  },

  //底部——下一首
  onNextSong: function () {
    var idx = ++this.data.key;
    app.globalData.indexs = idx;
    this.setData({
      key: idx,
      playImg: this.data.songImgUrl + this.data.playingData[idx].albummid + '.jpg'
    })
  },

  //底部歌单切换
  onChangeSong: function (ev) {
    var idx = ev.currentTarget.dataset.idx;
    app.globalData.indexs = idx;
    this.setData({
      key: idx,
      playImg: this.data.songImgUrl + this.data.playingData[idx].albummid + '.jpg'
    })
  },

  //动态刷新歌单列表
  upPlayData: function () {
    var that = this;

    setInterval(function () {
      var appPlay = app.globalData;
      if (appPlay.playingData.length == 0) return;

      if (that.data.playingData.length != 0) {
        //有播放数据
        if (that.data.playing != appPlay.playing) {
          that.setData({
            playing: appPlay.playing
          })
        }
        if (that.data.key != appPlay.indexs) {
          that.setData({
            key: appPlay.indexs,
            playImg: that.data.songImgUrl + appPlay.playingData[appPlay.indexs].albummid + '.jpg'
          })
        }

        that.setData({
          position: appPlay.position
        })

      } else {
        //没有播放数据
        that.setData({
          hideBottom: false,
          playingData: appPlay.playingData,
          key: appPlay.indexs,
          playImg: that.data.songImgUrl + appPlay.playingData[appPlay.indexs].albummid + '.jpg'
        })
      }

    }, 300)
  },

  //底部跳转到音乐播放页面
  onPlayPage: function () {
    var obj = {
      playingData: this.data.playingData,
      indexs: this.data.key,
      playing: this.data.playing
    };
    app.globalData = obj;
    wx.navigateTo({
      url: '../playMusic/playMusic'
    })
  }
})