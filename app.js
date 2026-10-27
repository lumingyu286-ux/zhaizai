/* 宅家导航 --------------------------------------------------- */
(function () {
  'use strict';

  /* 第一件事：标记脚本已启动，把 HTML 里的 .boot 兜底块藏掉。
     app.js 被拦截时这行不会执行，兜底块就留在页面上，
     访客至少看到一句解释而不是一片空白。

     注意 paintError() 注入的提示框用的是 .notice 而不是 .boot ——
     用同一个类名的话会被 .js-ok .boot{display:none} 一起藏掉，
     等于整套兜底白写。 */
  document.documentElement.className += ' js-ok';

  var FAV_KEY   = 'zz-favs';
  var THEME_KEY = 'zz-theme';
  var ADULT_KEY = 'zz-adult-ok';

  var $ = function (id) { return document.getElementById(id); };

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch (e) { return String(url).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''); }
  }

  /* --- 主题 ----------------------------------------------
     当前主题记在模块变量里，localStorage 只当「尽力而为」的持久化。
     不能每次都回头读存储：隐私模式下写入是失败的，再读又拿到系统值，
     切换按钮从第二下起就彻底失灵。 */

  var themeNow = 'light';
  var userPicked = false;

  function systemTheme() {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark' : 'light';
  }

  function applyTheme(t) {
    themeNow = (t === 'dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', themeNow);
    var btn = $('theme');
    /* 可见文字是「切换主题」，aria-label 必须包含它，
       否则语音控制念可见文字匹配不到这个按钮（WCAG 2.5.3）。 */
    if (btn) btn.setAttribute('aria-label', '切换主题，当前' + (themeNow === 'dark' ? '深色' : '浅色'));
  }

  function initTheme() {
    var saved = load(THEME_KEY);
    userPicked = (saved === 'light' || saved === 'dark');
    applyTheme(userPicked ? saved : systemTheme());

    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      /* 这里看模块变量，不回头读存储。隐私模式下写入是失败的，
         再读又拿到 null，用户手动选的主题会在系统切换时被悄悄改回去。 */
      var follow = function () { if (!userPicked) applyTheme(systemTheme()); };
      if (mq.addEventListener) mq.addEventListener('change', follow);
      else if (mq.addListener) mq.addListener(follow);
    }

    var btn = $('theme');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = themeNow === 'dark' ? 'light' : 'dark';
      userPicked = true;
      store(THEME_KEY, next);
      applyTheme(next);
    });
  }

  /* --- 收藏 ---------------------------------------------- */

  var favs = [];

  function loadFavs() {
    try {
      var raw = JSON.parse(load(FAV_KEY) || '[]');
      favs = Object.prototype.toString.call(raw) === '[object Array]' ? raw : [];
    } catch (e) { favs = []; }
  }

  function isFav(url) {
    for (var i = 0; i < favs.length; i++) { if (favs[i] === url) return true; }
    return false;
  }

  function toggleFav(url) {
    var out = [], found = false;
    for (var i = 0; i < favs.length; i++) {
      if (favs[i] === url) { found = true; } else { out.push(favs[i]); }
    }
    if (!found) out.push(url);
    favs = out;
    store(FAV_KEY, JSON.stringify(favs));
  }

  /* --- 条目 ----------------------------------------------
     .item 里放一个 <a> 和一个独立的收藏按钮。按钮不能嵌在
     <a> 里面 —— 嵌套可交互元素，键盘和读屏器都会出问题。 */

  var ALL = [];   // 扁平化，供查找用

  function makeItem(rec) {
    var wrap = document.createElement('div');
    wrap.className = 'item';

    var a = document.createElement('a');
    a.className = 'item-link';
    a.dataset.url = rec.url;
    a.dataset.name = rec.name;
    a.target = '_blank';
    a.rel = 'noopener';

    if (rec.adult) {
      /* 成人条目不给真 href：中键点击、右键「在新标签页打开」
         都不会触发 click 事件，有真地址就能绕过年龄确认。
         地址放 data-url，由 click 处理器确认后再 open。 */
      a.dataset.adult = '1';
      a.href = '#';
      a.removeAttribute('target');
    } else {
      a.href = rec.url;
    }

    var n = document.createElement('span');
    n.className = 'item-name';
    n.textContent = rec.name;

    if (rec.adult) {
      var b = document.createElement('span');
      b.className = 'item-badge';
      b.textContent = '18+';
      n.appendChild(b);
    }
    a.appendChild(n);

    if (rec.note) {
      var p = document.createElement('span');
      p.className = 'item-note';
      p.textContent = rec.note;
      p.title = rec.note;
      a.appendChild(p);
    }

    var h = document.createElement('span');
    h.className = 'item-host';
    h.textContent = hostOf(rec.url);
    a.appendChild(h);

    wrap.appendChild(a);

    var star = document.createElement('button');
    star.type = 'button';
    star.className = 'star';
    star.dataset.url = rec.url;
    star.dataset.name = rec.name;
    paintStar(star, isFav(rec.url));
    wrap.appendChild(star);

    return wrap;
  }

  function paintStar(btn, on) {
    btn.textContent = on ? '★' : '☆';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', (on ? '取消收藏 ' : '收藏 ') + (btn.dataset.name || ''));
  }

  /* --- 渲染 ---------------------------------------------- */

  var query = '';

  function slug(i) { return 'g' + i; }

  function paintAll() {
    $('brand-name').textContent = SITE.name || '宅家导航';
    $('brand-tag').textContent = SITE.tagline || '';
    document.title = (SITE.name || '宅家导航') + ' - 影视动漫游戏与阅读网址分类';
    $('foot-note').textContent = SITE.deployedOn
      ? '本页部署在 ' + SITE.deployedOn + '，收藏只存在你这台设备上。'
      : '收藏只存在你这台设备上，换浏览器就没了。';

    var chips = $('chips');
    var host = $('groups');

    GROUPS.forEach(function (g, gi) {
      var title = g[0], glyph = g[1], rows = g[2] || [];

      var chip = document.createElement('a');
      chip.className = 'chip';
      chip.href = '#' + slug(gi);
      var cg = document.createElement('span');
      cg.className = 'chip-glyph';
      cg.textContent = glyph || '';
      cg.setAttribute('aria-hidden', 'true');
      chip.appendChild(cg);
      chip.appendChild(document.createTextNode(title));
      chips.appendChild(chip);

      var block = document.createElement('section');
      block.className = 'block';
      block.id = slug(gi);
      block.dataset.group = title;

      var head = document.createElement('div');
      head.className = 'block-head';
      var h2 = document.createElement('h2');
      h2.textContent = title;
      var hg = document.createElement('span');
      hg.className = 'block-glyph';
      hg.textContent = glyph || '';
      hg.setAttribute('aria-hidden', 'true');
      var tally = document.createElement('span');
      tally.className = 'tally';
      tally.textContent = rows.length + ' 个';
      head.appendChild(h2);
      head.appendChild(hg);
      head.appendChild(tally);
      block.appendChild(head);

      var grid = document.createElement('div');
      grid.className = 'grid';
      if (rows.length === 1) grid.dataset.single = '1';

      rows.forEach(function (row) {
        var rec = {
          name: row[0], url: row[1], note: row[2] || '',
          adult: row[3] === 'adult', group: title
        };
        ALL.push(rec);
        grid.appendChild(makeItem(rec));
      });

      block.appendChild(grid);
      host.appendChild(block);
    });

    paintFavs();
  }

  /* 查找进行中就收起「常用」，否则同一个站会出现两次，
     而且 filter() 只遍历 #groups，收藏区的条目不会被过滤。 */
  function paintFavs() {
    var block = $('fav-block');
    var grid = $('fav-grid');
    grid.textContent = '';

    var picked = [];
    for (var i = 0; i < ALL.length; i++) {
      if (isFav(ALL[i].url)) picked.push(ALL[i]);
    }

    if (!picked.length || query) { block.hidden = true; return; }

    picked.forEach(function (rec) { grid.appendChild(makeItem(rec)); });
    $('fav-tally').textContent = picked.length + ' 个';
    block.hidden = false;
  }

  /* 收藏按钮用事件委托：条目会被重绘，逐个绑定会丢 */
  function wireStars() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.star') : null;
      if (!btn) return;
      var url = btn.dataset.url;
      var fromFavBlock = !!(btn.closest && btn.closest('#fav-grid'));

      toggleFav(url);
      var all = document.querySelectorAll('.star[data-url="' + cssEscape(url) + '"]');
      for (var i = 0; i < all.length; i++) paintStar(all[i], isFav(url));

      paintFavs();   // 会把 #fav-grid 整个重建

      /* 在「常用」里取消收藏时，刚才按下的那个按钮已经被重建掉了，
         焦点会掉回文档开头。把焦点挪到分类列表里同一个站的星标上。 */
      if (fromFavBlock && !document.contains(btn)) {
        var twin = document.querySelector('#groups .star[data-url="' + cssEscape(url) + '"]');
        if (twin) { try { twin.focus(); } catch (e2) {} }
      }
    });
  }

  function cssEscape(s) { return String(s).replace(/["\\]/g, '\\$&'); }

  /* --- 成人条目确认 --------------------------------------
     只拦这一条，其余链接照常直达。整站弹门会把豆瓣、Steam
     也锁在 18+ 警告后面，既荒唐也劝退正常访客。          */

  var pending = null;
  var adultOk = false;
  var opener = null;   // 弹框是从哪个链接打开的，关闭后焦点要还回去

  function openAsk(from) {
    opener = from || null;
    $('ask').hidden = false;
    /* 背景设 inert：否则 Tab 能走到遮罩后面的链接，
       aria-modal 只影响读屏器，管不住键盘焦点。 */
    var shell = $('shell');
    if ('inert' in shell) shell.inert = true;
    $('ask-ok').focus();
  }

  function closeAsk() {
    $('ask').hidden = true;
    var shell = $('shell');
    if ('inert' in shell) shell.inert = false;
    pending = null;
    /* 焦点还给触发的链接。不还的话键盘用户会被丢回 <body>，
       得从文档开头重新 Tab 一遍。注意要先解除 inert 再聚焦。 */
    if (opener && document.contains(opener)) {
      try { opener.focus(); } catch (e) {}
    }
    opener = null;
  }

  function askOpen() { return !$('ask').hidden; }

  function wireAdult() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('.item-link') : null;
      if (!a || a.dataset.adult !== '1') return;

      e.preventDefault();
      var url = a.dataset.url;
      if (!url) return;

      if (adultOk || load(ADULT_KEY) === '1') {
        window.open(url, '_blank', 'noopener');
        return;
      }

      pending = url;
      $('ask-name').textContent = a.dataset.name || '该站点';
      openAsk(a);
    });

    $('ask-ok').addEventListener('click', function () {
      adultOk = true;
      store(ADULT_KEY, '1');
      var url = pending;
      closeAsk();
      /* 在按钮的点击处理里 open，属于用户手势，不会被拦成弹窗 */
      if (url) window.open(url, '_blank', 'noopener');
    });

    $('ask-no').addEventListener('click', closeAsk);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && askOpen()) closeAsk();
    });
  }

  /* --- 查找 ---------------------------------------------- */

  var ENGINES = {
    baidu:  'https://www.baidu.com/s?wd=',
    bing:   'https://www.bing.com/search?q=',
    google: 'https://www.google.com/search?q='
  };

  function filter(q) {
    query = q.trim().toLowerCase();
    var blocks = document.querySelectorAll('#groups .block');
    var total = 0;

    for (var i = 0; i < blocks.length; i++) {
      var items = blocks[i].querySelectorAll('.item');
      var shown = 0;
      for (var j = 0; j < items.length; j++) {
        var link = items[j].querySelector('.item-link');
        var hay = (link.textContent + ' ' + blocks[i].dataset.group + ' ' +
                   (link.dataset.url || '')).toLowerCase();
        var hit = !query || hay.indexOf(query) !== -1;
        items[j].hidden = !hit;
        if (hit) shown++;
      }
      blocks[i].hidden = shown === 0;
      blocks[i].querySelector('.tally').textContent = shown + ' 个';
      total += shown;
    }

    paintFavs();

    var empty = $('empty');
    if (query && total === 0) {
      empty.textContent = '没有匹配「' + q.trim() + '」的站点。换个词，或者用上面的下拉切到百度、Bing、Google 直接搜。';
      empty.hidden = false;
    } else {
      empty.hidden = true;
    }
  }

  function wireFind() {
    var input = $('find');

    input.addEventListener('input', function () {
      if ($('engine').value === 'local') filter(input.value);
    });

    $('engine').addEventListener('change', function () {
      filter($('engine').value === 'local' ? input.value : '');
    });

    $('find-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      var eng = $('engine').value;
      if (eng === 'local') { filter(q); return; }
      if (!q) { input.focus(); return; }
      window.open(ENGINES[eng] + encodeURIComponent(q), '_blank', 'noopener');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      /* 确认框开着时别抢焦点：焦点会跳到遮罩后面看不见的输入框 */
      if (askOpen()) return;
      var t = e.target;
      var tag = t && t.tagName ? t.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable)) return;
      e.preventDefault();
      input.focus();
      input.select();
    });
  }

  /* --- 分类条高亮 ---------------------------------------- */

  function wireChips() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('.chip') : null;
      if (!a) return;
      var all = document.querySelectorAll('.chip');
      for (var i = 0; i < all.length; i++) {
        all[i].setAttribute('aria-current', all[i] === a ? 'true' : 'false');
      }
    });
  }

  /* --- 出问题时的兜底 ------------------------------------
     类名用 .notice，不能用 .boot —— .js-ok .boot 是隐藏规则，
     刚注入就会被藏掉。分类条也要一起清，否则留下一排指向
     已被清空的 #g0…#gN 的死链接。                        */

  function paintError(kind) {
    var chips = $('chips');
    if (chips) chips.textContent = '';

    var host = $('groups');
    host.textContent = '';

    var box = document.createElement('div');
    box.className = 'notice';
    var h = document.createElement('h2');
    h.textContent = kind === 'data' ? '网址数据没能加载' : '网址数据格式有问题';
    var p = document.createElement('p');
    p.textContent = kind === 'data'
      ? '刷新一下通常就好。如果反复失败，说明 sites.js 被拦截了。'
      : '检查 sites.js 里每个分类是不是 [分类名, 角标, [条目...]] 这三项。';
    box.appendChild(h);
    box.appendChild(p);
    host.appendChild(box);
  }

  /* --- 启动 ----------------------------------------------
     全部放进 try：任何一步抛错都不能让 shell 卡在 hidden，
     否则页面就是一片白 —— 而 HTML 里的 .boot 此时已被
     js-ok 藏掉，连那句解释都看不到。                      */

  try { initTheme(); } catch (e) {}
  try { loadFavs(); } catch (e) {}

  var problem = '';
  try {
    if (typeof SITE === 'undefined' || typeof GROUPS === 'undefined') problem = 'data';
    else paintAll();
  } catch (e) {
    problem = 'render';
  }
  if (problem) { try { paintError(problem); } catch (e) {} }

  /* 事件绑定单独兜，而且绝不能走 paintError —— 那会清空
     #chips 和 #groups，把一次本来成功的渲染抹掉，再甩出一句
     「检查 sites.js 的格式」，而 sites.js 其实毫无问题。
     逐个 try 还能保证前面一个绑定失败不连累后面的。 */
  try { wireStars(); } catch (e) {}
  try { wireAdult(); } catch (e) {}
  try { wireFind(); }  catch (e) {}
  try { wireChips(); } catch (e) {}

  $('shell').hidden = false;
})();
