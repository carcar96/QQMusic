var utils = require('../../utils/utils.js');
var app = getApp();
Page({

  data: {
    playingData: {},
    playImg: '',
    playLink: '',
    playKrc: [],
    playKrcTime: [],

    playing: true,
    timer: null,
    timer1: null,
    //进度条
    duration: '00:00',
    current: '00:00',
    totalDuration: 0,
    loadWidth: 0,
    barWidth: 0,
    updateBar: true,

    //底部菜单
    menuShow: false,
    addclass: '',

    //屏幕宽
    sWidth: 0,

    key: 0,//播放第key首
    krcIdx: 0,//播放第几句歌词
    loadAnimate: true, //加载中动画  

    collected: false, //收藏状态
    collectList: [],  //收藏列表 
    curList: 0,

    scrollView: false,
    timer3: null
  },

  onLoad: function () {
    var that = this;
    //获取屏幕宽度
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          sWidth: res.windowWidth
        })
      }
    })
    this.getAppMusic();//从app获取歌单信息
    this.upMusic(); //更新音乐信息
    this.listenMusic();//监听音乐
    this.getStorage();//获取缓存
    this.listenIndex();//监听首页音乐播放

  },

  //从app获取歌单信息
  getAppMusic: function () {
    this.setData({
      playingData: app.globalData.playingData,
      key: app.globalData.indexs,
      playing: app.globalData.playing
    })
  },

  //本地缓存
  getStorage: function () {
    var collectList = wx.getStorageSync('collectList');
    var song = this.data.playingData[this.data.key];
    var id = song.songid;

    if (collectList) {
      //缓存已经存在
      this.setData({
        collectList: collectList
      })

      //找出收藏状态
      for (var i = 0; i < collectList.length; i++) {
        if (collectList[i].songid == id) {
          this.setData({
            collected: collectList[i].collected
          })
        }
      }
    } else {
      //不存在，则新建缓存
      var collectList = [];
      wx.setStorageSync('collectList', collectList);
    }
  },

  //收藏与否
  onLove: function () {
    var collectList = wx.getStorageSync('collectList');//读取缓存
    var song = this.data.playingData[this.data.key];
    var id = song.songid;

    var c_collected = this.data.collected;
    c_collected = !c_collected; //取反
    if (c_collected) {
      song.collected = c_collected;//设置状态      
      collectList.push(song);
    } else {
      for (var i = 0; i < collectList.length; i++) {
        if (collectList[i].songid == id) {
          collectList.splice(i, 1);
        }
      }
    }

    //更新数据
    this.setData({
      collected: c_collected
    });

    wx.setStorageSync('collectList', collectList);//更新缓存   

    wx.showToast({
      title: c_collected ? '收藏成功' : '取消收藏成功',
      icon: 'success'
    });

    this.getStorage();
  },

  //更新封面
  upMusic: function () {
    var obj = this.data.playingData[this.data.key];

    var imgUrl = 'http://y.gtimg.cn/music/photo_new/T002R150x150M000';
    var playImg = imgUrl + obj.albummid + '.jpg';

    this.setData({
      playImg: playImg
    })

    this.getKrc();//歌词  
    this.upMusicLink();//音乐链接      
  },

  //更新音乐链接
  upMusicLink: function () {
    var obj = this.data.playingData[this.data.key];
    var songUrl = 'http://ws.stream.qqmusic.qq.com/C100';
    var newsongUrl = 'http://isure.stream.qqmusic.qq.com/C100';

    var playLink = '';
    if (obj.strMediaMid) {
      playLink = newsongUrl + obj.strMediaMid + '.m4a?fromtag=32';
    } else {
      playLink = songUrl + obj.songmid + '.m4a?fromtag=38';
    }

    this.setData({
      playLink: playLink
    })

  },

  //获取歌词
  getKrc: function () {
    var that = this;
    var musicid = this.data.playingData[this.data.key].songid;
    utils.getLyric(musicid, function (res) {
      var lyric = res.showapi_res_body.lyric;
      var s = that.dealKrc(lyric);
      s ? s.push('(完)') : '暂无歌词';
      that.setData({
        playKrc: s
      })
    });
  },

  //处理歌词
  dealKrc: function (lyric) {

    var reg0 = /\&#46;/g;//转换&#46
    var s0 = lyric.replace(reg0, '.');

    var reg1 = /\&#58;/g;//转换&#58
    var s1 = s0.replace(reg1, ':');

    var reg2 = /\&#32;/g;//转换&#32
    var s2 = s1.replace(reg2, ' ');

    var reg3 = /\&#40;/g;//转换&#40;
    var s3 = s2.replace(reg3, '(');

    var reg4 = /\&#41;/g;//转换&#41;
    var s4 = s3.replace(reg4, ')');

    var reg5 = /\&#45;/g;//转换&#45;
    var s5 = s4.replace(reg5, '-');

    var reg6 = /\&#39;/g;//转换&#39;
    var s6 = s5.replace(reg6, "'");

    var reg7 = /\&#38;apos&#59;/g;//转换&#38;
    var s7 = s6.replace(reg7, "'");

    //去掉[]后没有歌词，但[]内又有时间的
    var reg8 = /\[[^\[]+\]&#10;{1}/g;
    var s8 = s7.replace(reg8, '');

    var reg9 = /\[(.+?)\]/g;//去掉[]
    var t = s8.match(reg9);//歌词对应的时间
    var s9 = s8.replace(reg9, '');

    var reg10 = /\&#10;/g;//转换&#10
    var s10 = s9.replace(reg10, '\n');//换行       

    //其他
    var reg11 = /\&(.+?)\;/g;
    var s11 = s10.replace(reg11, '');

    var s = s11.split('\n');

    this.dealKrcTime(t);
    return s;
  },

  //处理歌词时间
  dealKrcTime: function (time) {
    var arr = [];
    for (var i = 0; i < time.length; i++) {
      var t = time[i];
      var idx1 = t.indexOf(':');
      var idx2 = t.indexOf('.');
      var m = parseInt(t.substring(1, idx1));
      var s = parseInt(t.substring(idx1 + 1, idx2));
      arr.push(m * 60 + s);
    }

    this.setData({
      playKrcTime: arr,
      loadAnimate: false //加载中动画
    })

    this.autoPlay();//播放音乐         
  },

  //播放暂停
  onPlay: function () {
    var playing = !this.data.playing;
    this.setData({
      playing: playing,
    })
    this.autoPlay();
  },

  //播放音乐
  autoPlay: function () {
    var that = this;
    if (this.data.playing) {
      wx.playBackgroundAudio({
        dataUrl: that.data.playLink
      })
    }
    else {
      wx.pauseBackgroundAudio();
    }
    this.openTimer();
  },

  //定时器刷新时间
  openTimer: function () {
    clearInterval(this.data.timer);
    var that = this;
    //注意观察定时器是否关闭
    that.data.timer = setInterval(function () {
      that.getLoading();
      // console.log(1)
    }, 300)
  },

  //获取歌曲播放进度
  getLoading: function () {
    var that = this;
    wx.getBackgroundAudioPlayerState({
      success: function (res) {

        if (res.status == 2) return;
        var current = res.currentPosition;
        var duration = res.duration;

        //总时长
        if (!that.data.totalDuration) { //第一次
          var krcTime = that.data.playKrcTime;  //让歌词中的最后一个“完”字 cur
          krcTime.push(duration - 1);
          var s_d = that.handlingTime(duration);
          that.setData({
            duration: s_d,
            totalDuration: duration,
            playKrcTime: krcTime
          })
        }

        //拖动进度条过程中，不更新音乐目前播放的时间
        if (that.data.updateBar) {
          that.loadBar(current, duration);
        }

        //播放结束
        if (current == duration) {
          that.dealInit(++that.data.key);
        }

        that.krcIndex(current);
        that.updataApp();
      }
    })
  },

  //处理时间
  handlingTime: function (time) {
    var t1 = parseInt(time / 60);
    var t2 = Math.ceil(time % 60);
    t2 = t2 < 10 ? ('0' + t2) : t2;
    var t = '0' + t1 + ':' + t2;
    return t;
  },

  //进度条
  loadBar: function (c, d) {
    //当前播放到几分之几  
    var pre = c / d;
    //进度条的宽度
    var loadWidth = pre * 100;

    var s_c = this.handlingTime(c);

    this.setData({
      current: s_c,
      loadWidth: loadWidth
    })
  },

  //判断第几句歌词
  krcIndex: function (p, bool) {
    var krcIdx = this.data.krcIdx;
    var times = this.data.playKrcTime;
    for (var i = 0; i < times.length; i++) {
      var c = times[i];
      if (c == p) {
        krcIdx = i;
      }
      //拖进度条，歌词变化
      if (bool) {
        if (c <= p) { krcIdx = i }
      }
    }

    this.setData({
      krcIdx: krcIdx
    })
  },

  //监听音乐
  listenMusic: function () {
    var that = this;
    //播放
    wx.onBackgroundAudioPlay(function () {
      that.setData({
        playing: true
      })
      that.updataApp();
    })
    //停止
    wx.onBackgroundAudioPause(function () {
      that.setData({
        playing: false
      })
      that.updataApp();
    })
    //结束
    wx.onBackgroundAudioStop(function () {
      that.setData({
        current: that.data.duration,
        loadWidth: 100
      })
      clearInterval(that.data.timer);
      that.updataApp();
    });
  },

  //切歌处理
  dealInit: function (key) {
    wx.pauseBackgroundAudio();
    var that = this;
    if (key >= that.data.playingData.length) {
      key = 0;
    } else if (key < 0) {
      key = that.data.playingData.length - 1;
    }

    that.setData({
      key: key,
      playImg: '',
      playLink: '',
      playKrc: [],

      totalDuration: 0,
      loadWidth: 0,
      barWidth: 0,
      duration: '00:00',
      current: '00:00',

      updateBar: true,
      menuShow: false,
      playing: true,
      krcIdx: 0,

      collected: false
    })

    that.upMusic();
    that.updataApp();
    that.autoPlay();
    that.getStorage();
  },

  //上一首
  onLast: function () {
    this.dealInit(--this.data.key);
  },

  //下一首
  onNext: function () {
    this.dealInit(++this.data.key);
  },

  //换歌
  onChangeSong: function (ev) {
    var idx = ev.currentTarget.dataset.idx;

    if (ev.currentTarget.dataset.collect) {
      //收藏列表点击
      this.setData({
        playingData: this.data.collectList,
        curList: 0
      })
    }
    this.dealInit(idx);
  },

  //显示歌单
  onMunes: function () {
    this.setData({
      menuShow: true,
      addclass: 'show'
    })
  },

  //隐藏歌单
  onClose: function () {
    this.setData({
      menuShow: false,
      addclass: 'hide'
    })
  },

  /*father操作*/
  //按下
  onTouchStart: function (ev) {

    if (!this.data.barWidth) {
      //bar的总宽度
      var w = this.data.sWidth - ev.currentTarget.offsetLeft * 2;
      this.setData({
        barWidth: w
      })
    }

    var x = (ev.touches[0].clientX - ev.currentTarget.offsetLeft) / this.data.barWidth * 100;

    if (x < 0) {
      x = 0;
    } else if (x > 99) {
      x = 99;
    }

    this.setData({
      loadWidth: x,
      updateBar: false
    })
  },
  //移动
  onTouchMove: function (ev) {
    var x = (ev.touches[0].clientX - ev.currentTarget.offsetLeft) / this.data.barWidth * 100;

    if (x < 0) {
      x = 0;
    } else if (x > 99) {
      x = 99;
    }

    //更新数字
    var p = parseInt(x / 100 * this.data.totalDuration);
    var c = this.handlingTime(p);

    //节流更新进度条状态
    var that = this;
    clearTimeout(this.data.timer1);
    this.data.timer1 = setTimeout(function () {
      that.setData({
        loadWidth: x,
        current: c
      })
    }, 10)
  },

  //松开
  onTouchEnd: function () {
    var p = parseInt(this.data.loadWidth / 100 * this.data.totalDuration);

    //只有在播放情况下才能执行
    wx.seekBackgroundAudio({
      position: p
    })

    this.setData({
      updateBar: true
    })
    this.krcIndex(p, true);
  },

  //scrollView滚动
  onScrollStart: function (ev) {
    clearTimeout(this.data.timer3);
    this.setData({
      scrollView: true
    })
  },

  onScrollEnd: function (ev) {
    var that = this;
    this.data.timer3 = setTimeout(function () {
      that.setData({
        scrollView: false
      })
    }, 1500)
  },

  //更新app数据
  updataApp: function () {
    if (app.globalData.indexs != this.data.key) {
      app.globalData.indexs = this.data.key;
    } else if (app.globalData.playing != this.data.playing) {
      app.globalData.playing = this.data.playing;
    } else if (app.globalData.position != this.data.loadWidth) {
      app.globalData.position = this.data.loadWidth;
    }
  },

  //首页播放状态
  listenIndex: function () {
    var that = this;
    setInterval(function () {
      //播放状态
      if (that.data.playing != app.globalData.playing) {
        that.setData({
          playing: app.globalData.playing
        })
        that.autoPlay();
      }
      //播放第几首
      if (that.data.key != app.globalData.indexs) {
        that.setData({
          key: app.globalData.indexs
        })
        that.upMusic();
      }

    }, 300)
  }
})