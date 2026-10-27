/* ===========================================================
   只需要改这一个文件。

   分类格式：[分类名, 角标, [条目...]]
   条目格式：[名称, 网址, 说明]
             [名称, 网址, 说明, 'adult']  ← 第四项加 'adult'
                                            点击时会先弹年龄确认

   顺序即显示顺序。成人百科排第一位。
   =========================================================== */

/* 用 var 不用 const：app.js 通篇是 ES5 写法（var、addListener 回退、
   closest 探测）。这里若用 const，老引擎直接解析失败，
   结果会被报成「sites.js 被拦截了」，把人往错误方向带。 */
var SITE = {
  name: '宅家导航',
  tagline: '闲下来想看点什么的时候，从这儿开始',
  deployedOn: '',
};

var GROUPS = [

['成人内容', '18+', [
  ['成人内容百科', 'https://chengrenbaike.com', '性知识与两性健康百科，仅限成年人', 'adult'],
]],

['影视与剧集', '▣', [
  ['豆瓣电影',   'https://movie.douban.com',        '评分、影评与片单'],
  ['IMDb',       'https://www.imdb.com',            '全球影视资料库'],
  ['烂番茄',     'https://www.rottentomatoes.com',  '影评人与观众评分'],
  ['猫眼电影',   'https://www.maoyan.com',          '票房与院线排片'],
  ['JustWatch',  'https://www.justwatch.com',       '查一部片在哪个平台能看'],
  ['Letterboxd', 'https://letterboxd.com',          '观影记录与影迷社区'],
]],

['动漫与漫画', '◈', [
  ['Bangumi',      'https://bgm.tv',                '番剧评分与追番管理'],
  ['MyAnimeList',  'https://myanimelist.net',       '动画与漫画资料库'],
  ['AniList',      'https://anilist.co',            '追番进度与社区'],
  ['哔哩哔哩漫画', 'https://manga.bilibili.com',    '正版漫画在线看'],
  ['快看漫画',     'https://www.kuaikanmanhua.com', '国漫与条漫'],
  ['腾讯动漫',     'https://ac.qq.com',             '国漫与日漫正版'],
]],

['音乐与播客', '♪', [
  ['Spotify',     'https://open.spotify.com',       '流媒体音乐与歌单'],
  ['Apple Music', 'https://music.apple.com',        '苹果流媒体音乐'],
  ['小宇宙',      'https://www.xiaoyuzhoufm.com',   '中文播客'],
  ['喜马拉雅',    'https://www.ximalaya.com',       '有声书与音频节目'],
  ['Last.fm',     'https://www.last.fm',            '听歌记录与音乐推荐'],
  ['Bandcamp',    'https://bandcamp.com',           '独立音乐人与专辑'],
]],

['游戏', '▶', [
  ['Steam',       'https://store.steampowered.com', 'PC 游戏商店与社区'],
  ['Epic Games',  'https://store.epicgames.com',    '游戏商店，每周有免费游戏'],
  ['itch.io',     'https://itch.io',                '独立游戏与小品级作品'],
  ['SteamDB',     'https://steamdb.info',           '价格历史与在线人数'],
  ['机核',        'https://www.gcores.com',         '游戏文化内容与播客'],
  ['游民星空',    'https://www.gamersky.com',       '游戏资讯与攻略'],
]],

['小说与阅读', '▤', [
  ['起点中文网',       'https://www.qidian.com',  '网络小说连载'],
  ['晋江文学城',       'https://www.jjwxc.net',   '原创小说与同人'],
  ['豆瓣读书',         'https://book.douban.com', '书评、评分与书单'],
  ['Project Gutenberg','https://www.gutenberg.org','公版电子书免费下载'],
  ['互联网档案馆',     'https://archive.org',     '书籍、音频与网页存档'],
]],

['社区与论坛', '◎', [
  ['贴吧',     'https://tieba.baidu.com',      '兴趣小组与讨论'],
  ['虎扑',     'https://www.hupu.com',         '体育、步行街与杂谈'],
  ['V2EX',     'https://www.v2ex.com',         '技术人聚集的社区'],
  ['Reddit',   'https://www.reddit.com',       '全球兴趣社区'],
  ['小红书',   'https://www.xiaohongshu.com',  '生活方式与种草笔记'],
  ['微博',     'https://weibo.com',            '热搜与实时话题'],
]],

['体育与赛事', '⚑', [
  ['直播吧',     'https://www.zhibo8.cc',      '赛事直播与比分'],
  ['懂球帝',     'https://www.dongqiudi.com',  '足球资讯与数据'],
  ['ESPN',       'https://www.espn.com',       '全球体育新闻'],
  ['FlashScore', 'https://www.flashscore.com', '实时比分与赛程'],
  ['NBA',        'https://www.nba.com',        '赛程、数据与集锦'],
]],

['财经与行情', '◫', [
  ['东方财富',     'https://www.eastmoney.com',   '行情、资讯与数据'],
  ['雪球',         'https://xueqiu.com',          '投资讨论与组合'],
  ['同花顺',       'https://www.10jqka.com.cn',   '股票行情与财经'],
  ['TradingView',  'https://cn.tradingview.com',  '图表与全球行情'],
  ['Investing',    'https://cn.investing.com',    '全球市场与财经日历'],
]],

['求职与副业', '✎', [
  ['BOSS 直聘', 'https://www.zhipin.com',     '和招聘方直接聊'],
  ['拉勾',      'https://www.lagou.com',      '互联网岗位'],
  ['猎聘',      'https://www.liepin.com',     '中高端职位'],
  ['LinkedIn',  'https://www.linkedin.com',   '职业社交与海外机会'],
  ['实习僧',    'https://www.shixiseng.com',  '实习与校招'],
]],

];
