//推荐,排行榜,搜索
function dataReq(url, callBack) {
  wx.request({
    url: url,
    data: {
      g_tk: 5381,
      uin: 0,
      format: 'json',
      inCharset: ' utf - 8',
      outCharset: 'utf - 8',
      notice: 0,
      platform: 'h5',
      needNewCode: 1,
      _: new Date().getTime()
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      if (res.statusCode == 200) {
        callBack(res.data);
      }
    }
  })
}
//查找
function searchReq(data, callBack) {
  wx.request({
    url: 'https://c.y.qq.com/soso/fcgi-bin/search_for_qq_cp',
    data: {
      g_tk: 5381,
      uin: 0,
      format: 'json',
      inCharset: ' utf - 8',
      outCharset: 'utf - 8',
      notice: 0,
      platform: 'h5',
      needNewCode: 1,
      w: data.val,
      zhidaqu: 1,
      catZhida: 1,
      t: 0,
      flag: 1,
      ie: 'utf - 8',
      sem: 1,
      aggr: 0,
      perpage: 20,
      n: 20,
      p: data.page,
      remoteplace: 'txt.mqq.all1',
      _: new Date().getTime()
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      if (res.statusCode == 200) {
        callBack(res.data);
      }
    }
  })
}

//流行指数
function topReq(id, url, callBack) {
  wx.request({
    url: url,
    data: {
      g_tk: 5381,
      uin: 0,
      format: 'json',
      inCharset: 'utf - 8',
      outCharset: 'utf - 8',
      notice: 0,
      platform: 'h5',
      needNewCode: 1,
      tpl: 3,
      page: 'detail',
      type: 'top',
      topid: id,
      _: new Date().getTime()
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      if (res.statusCode == 200) {
        callBack(res.data);
      }
    }
  })
}

//处理听歌人数
function listenNum(num) {
  var num = (num / 10000).toFixed(1);
  return num;
}

//背景颜色
function bgColor(p_url, callBack) {
  wx.request({
    url: 'https://c.y.qq.com/splcloud/fcgi-bin/fcg_gedanpic_magiccolor.fcg',
    data: {
      g_tk: 5381,
      uin: 0,
      format: 'jsonp',
      inCharset: 'utf - 8',
      outCharset: 'utf - 8',
      notice: 0,
      platform: 'h5',
      needNewCode: 1,
      _: new Date().getTime(),
      pic_url: p_url,
      jsonpCallback: 'bgColorCallback'

    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      if (res.statusCode == 200) {
        callBack(res);
      }
    }
  })
}

//首页热歌
function hotSong(disstid, callBack) {
  wx.request({
    url: 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg',
    data: {
      g_tk: 5381,
      uin: 0,
      format: 'jsonp',
      inCharset: 'utf - 8',
      outCharset: 'utf - 8',
      notice: 0,
      platform: 'h5',
      needNewCode: 1,
      pic: 500,
      disstid: disstid,
      type: 1,
      json: 1,
      utf8: 1,
      onlysong: 0,
      nosign: 1,
      jsonpCallback: 'taogeDataCallback',
      _: new Date().getTime()
    },
    header: {
      'content-type': 'application/json'
    },
    success: function (res) {
      if (res.statusCode == 200) {
        callBack(res);
      }
    }
  })
}

/**
 * 获取单首歌曲的信息
 */
function getSongInfo(id, mid, callback) {
  wx.request({
    url: 'https://c.y.qq.com/splcloud/fcgi-bin/fcg_list_songinfo_cp.fcg',
    data: {
      url: 1,
      idlist: id,
      midlist: mid,
      typelist: 0
    },
    method: 'GET',
    header: { 'content-type': 'application/json' },
    success: function (res) {
      if (res.statusCode == 200) {
        var data = res.data.data;
        callback(data);
      }
    }
  });
}

/**
 * 获取歌词
 */
function getLyric(id, callback) {
  wx.request({
    url: 'https://route.showapi.com/213-2',
    data: {
      musicid: id,
      showapi_appid: '23654',
      showapi_timestamp: new Date().getTime(),
      showapi_sign: 'd23793312daf46ad88a06294772b7aac'
    },
    header: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    success: function (res) {
      if (res.statusCode == 200) {
        callback(res.data);
      }
    }
  });
}

module.exports = {
  dataReq: dataReq, //tab数据
  searchReq: searchReq, //搜索结果
  topReq: topReq,  //排行榜中每个流行指数的数据
  listenNum: listenNum, //听歌人数
  bgColor: bgColor, //背景颜色
  hotSong: hotSong, //首页热歌
  getLyric: getLyric, //歌词
  getSongInfo:getSongInfo
}