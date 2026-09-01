// Three variants of the community video flow, switchable via ?variant= on this prototype route.
const app = document.querySelector('#app');
const variantNames = { A: '瀑布流', B: '大封面', C: '主题画册' };
const posts = [
  { id: 'v1001', media: 'video', image: 'assets/sea.jpg', title: '海风与远方的一分钟', author: '绘绘子', likes: 128, views: '1.2万', duration: '00:30', desc: '海风、云层和安静的潮汐。跟着镜头收藏这一分钟的蓝色。', tags: ['旅行记录', '场景灵感'] },
  { id: 'v1002', media: 'video', image: 'assets/queen.jpg', title: '新角色设定：鎏金与夜色', author: '森行', likes: 86, views: 9732, duration: '00:46', desc: '从服装纹样到配色逻辑，完整记录角色设定的诞生过程。', tags: ['OC角色档案', '服装设计'] },
  { id: 'p1003', media: 'image', image: 'assets/pixel.jpg', title: '像素小屋今日也在营业', author: '木芽', likes: 43, views: 6180, duration: '', desc: '像素风角色练习。', tags: ['像素画'] },
  { id: 'p1004', media: 'image', image: 'assets/white.jpg', title: '小千金表情练习', author: '鱼鱼', likes: 214, views: '2.8万', duration: '', desc: '角色表情与发型练习。', tags: ['OC角色档案'] },
  { id: 'v1005', media: 'video', image: 'assets/comic.jpg', title: '谁的 OC 能挑战这张构图？', author: '绘绘子', likes: 111, views: '1.6万', duration: '00:18', desc: '构图挑战第二期，带上你的原创角色一起参加。', tags: ['绘画挑战', 'OC角色档案'] },
  { id: 'v1006', media: 'video', image: 'assets/glass.jpg', title: '玻璃杯里的蓝色精灵', author: '星野晴', likes: 65, views: 8210, duration: '00:27', desc: '材质与光影练习过程记录。', tags: ['绘画过程', '光影练习'] },
  { id: 'p1007', media: 'image', image: 'assets/gold.jpg', title: '黑与金的叙事感', author: '阿眠', likes: 72, views: 7401, duration: '', desc: '双人角色关系练习。', tags: ['角色关系'] },
  { id: 'v1008', media: 'video', image: 'assets/soup.jpg', title: '深夜食堂：一碗治愈系关东煮', author: '栗子', likes: 153, views: '2.1万', duration: '00:32', desc: '从草稿到成稿的食物插画过程。', tags: ['绘画过程', '治愈系'] }
];

const state = {
  variant: new URLSearchParams(location.search).get('variant') || 'A',
  screen: 'home',
  activeTab: '推荐',
  category: '全部',
  postIndex: 0,
  playing: false,
  progress: 36,
  drawer: false,
  share: false,
  liked: false,
  saved: false,
  following: false,
  aiDisclosure: true,
  downloadEnabled: true,
  scenario: 'normal',
  toast: '',
  publishStage: 'idle',
  manageMenu: false,
  comments: [
    { author: '晴雪', text: '光影好舒服，已经收藏了！', likes: 12 },
    { author: '白桃苏打', text: '想看下一期角色服装拆解。', likes: 7 }
  ]
};

let toastTimer;
let publishTimers = [];

function currentPost() {
  const candidate = posts[state.postIndex] || posts[0];
  if (candidate.media === 'video') return candidate;
  return posts.find((post) => post.media === 'video') || posts[0];
}

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function bottomNav(active) {
  return `<nav class="bottom-nav" aria-label="主导航">
    <button class="nav-btn ${active === 'home' ? 'active' : ''}" data-action="go-home" title="首页"><span>${icon('house')}</span><span>首页</span></button>
    <button class="nav-btn" data-action="toast" data-message="角色卡功能沿用现有流程" title="角色卡"><span>${icon('briefcase-business')}</span><span>角色卡</span></button>
    <button class="nav-btn publish" data-action="go-publish" title="发布"><span>${icon('plus')}</span><span>发布</span></button>
    <button class="nav-btn" data-action="toast" data-message="消息功能沿用现有流程" title="消息"><span>${icon('message-circle')}</span><span>消息</span></button>
    <button class="nav-btn ${active === 'profile' ? 'active' : ''}" data-action="go-profile" title="我的"><span>${icon('user-round')}</span><span>我的</span></button>
  </nav>`;
}

function homeTopbar() {
  return `<header class="topbar">
    <div class="brand"><img src="assets/logo.png" alt="幸绘"><strong>幸绘</strong></div>
    <div class="feed-tabs" role="tablist">
      ${['最新', '推荐', '关注'].map((tab) => `<button class="feed-tab ${state.activeTab === tab ? 'active' : ''}" data-action="feed-tab" data-tab="${tab}" role="tab">${tab}</button>`).join('')}
    </div>
    <button class="icon-btn" data-action="toast" data-message="搜索视频、图文和角色" title="搜索" aria-label="搜索">${icon('search')}</button>
  </header>`;
}

function card(post, index, className = '') {
  const video = post.media === 'video';
  return `<article class="content-card ${className}">
    <button class="card-hit" data-action="${video ? 'open-detail' : 'toast'}" data-index="${index}" ${video ? '' : 'data-message="图文详情沿用现有交互"'}>
      <div style="position:relative">
        <img class="card-media" src="${post.image}" alt="${post.title}">
        ${video ? `<span class="media-badge icon-only" title="视频" aria-label="视频">${icon('play')}</span>` : ''}
      </div>
      <div class="card-body">
        <h2 class="card-title">${post.title}</h2>
        <div class="card-meta">
          <span class="mini-author"><img src="assets/avatar.jpg" alt=""><span>${post.author}</span></span>
          <span class="metric">${icon('heart')} ${post.likes}</span>
        </div>
      </div>
    </button>
  </article>`;
}

function homeA() {
  const classes = ['tall', 'short', '', 'tall', '', 'short', 'tall', ''];
  return `${homeTopbar()}
    <div class="scroll-area">
      <section class="hero-banner">
        <img src="assets/banner.jpg" alt="社区公约活动">
        <div class="hero-copy"><strong>社区视频季</strong><span>记录灵感，分享创作过程</span></div>
      </section>
      <section class="masonry" aria-label="社区内容瀑布流">${posts.map((post, index) => card(post, index, classes[index])).join('')}</section>
    </div>
    ${bottomNav('home')}`;
}

function homeB() {
  return `${homeTopbar()}
    <div class="scroll-area">
      <section class="feed-list">
        ${posts.filter((post) => post.media === 'video').map((post) => {
          const index = posts.indexOf(post);
          return `<article class="episode-card">
            <button data-action="open-detail" data-index="${index}">
              <div class="episode-media">
                <img src="${post.image}" alt="${post.title}">
                <span class="episode-index">VIDEO · ${post.duration}</span>
                <span class="episode-play"><span>${icon('play')}</span></span>
              </div>
              <div class="episode-body">
                <h3>${post.title}</h3>
                <p>${post.desc}</p>
                <div class="card-meta"><span class="mini-author"><img src="assets/avatar.jpg" alt=""><span>${post.author}</span></span><span>${post.views} 人浏览 · ${post.likes} 喜欢</span></div>
              </div>
            </button>
          </article>`;
        }).join('')}
      </section>
    </div>
    ${bottomNav('home')}`;
}

function homeC() {
  const categories = ['全部', 'OC角色', '绘画过程', '旅行', '治愈系'];
  return `${homeTopbar()}
    <div class="scroll-area">
      <section class="catalog-head">
        <h1>灵感放映室</h1>
        <p>按角色与主题探索社区视频</p>
        <div class="chip-row">${categories.map((item) => `<button class="chip ${state.category === item ? 'active' : ''}" data-action="category" data-category="${item}">${item}</button>`).join('')}</div>
      </section>
      <section class="catalog-grid">
        ${posts.map((post, index) => `<button class="catalog-tile ${index === 0 ? 'featured' : index === 4 ? 'wide' : ''}" data-action="${post.media === 'video' ? 'open-detail' : 'toast'}" data-index="${index}" ${post.media === 'video' ? '' : 'data-message="图文详情沿用现有交互"'}>
          <img src="${post.image}" alt="${post.title}">
          ${post.media === 'video' ? `<i>${icon('play')}</i>` : ''}
          <span>${post.title}</span>
        </button>`).join('')}
      </section>
    </div>
    ${bottomNav('home')}`;
}

function detailScreen() {
  const post = currentPost();
  const downloadLocked = state.scenario === 'locked' || !state.downloadEnabled;
  return `<section class="screen detail-screen">
    <div class="video-stage" data-swipe="video" data-action="toggle-play">
      <img class="video-poster" src="${post.image}" alt="${post.title}">
      <div class="video-scrim"></div>
      <header class="detail-top">
        <button class="icon-btn" data-action="back" title="返回" aria-label="返回">${icon('chevron-left')}</button>
        <button class="icon-btn" data-action="open-share" title="分享" aria-label="分享">${icon('share-2')}</button>
      </header>
      ${state.scenario === 'weak' ? `<div class="network-pill">网络较慢，已切换至 480P</div>` : ''}
      ${state.playing ? '' : `<button class="center-play" data-action="toggle-play" title="播放" aria-label="播放">${icon('play')}</button>`}
      <div class="detail-info">
        <div class="author-row"><img src="assets/avatar.jpg" alt="${post.author}"><strong>@${post.author}</strong><button class="follow-btn ${state.following ? 'active' : ''}" data-action="toggle-follow">${state.following ? '已关注' : '关注'}</button></div>
        <h2>${post.title}</h2>
        <p>${post.desc} <button class="follow-btn" data-action="open-drawer">展开</button></p>
      </div>
      <div class="detail-actions">
        <button class="detail-action ${state.liked ? 'active' : ''}" data-action="toggle-like" title="喜欢"><span>${icon('heart')}</span><span>${state.liked ? post.likes + 1 : post.likes}</span></button>
        <button class="detail-action" data-action="open-drawer" title="评论"><span>${icon('message-square')}</span><span>${state.comments.length}</span></button>
        <button class="detail-action ${state.saved ? 'active' : ''}" data-action="toggle-save" title="收藏"><span>${icon('star')}</span><span>${state.saved ? '已收藏' : '收藏'}</span></button>
      </div>
      <div class="player-bar"><span id="play-time">${formatTime(state.progress, post.duration)}</span><div class="progress"><span id="play-progress" style="--progress:${state.progress}%"></span></div><span>${post.duration}</span></div>
      <div class="detail-composer"><button class="composer-trigger" data-action="open-drawer">发表感想，留下足迹…</button></div>
    </div>
    ${state.drawer ? detailDrawer(post) : ''}
    ${state.share ? shareSheet(downloadLocked) : ''}
    ${state.toast ? `<div class="toast">${state.toast}</div>` : ''}
  </section>`;
}

function detailDrawer(post) {
  return `<div class="drawer" data-action="close-drawer">
    <section class="drawer-panel" role="dialog" aria-modal="true" aria-label="作品详情与评论">
      <div class="sheet-handle"></div>
      <header class="drawer-head"><strong>作品详情 · ${state.comments.length} 条评论</strong><button class="icon-btn" data-action="close-drawer" title="关闭">${icon('x')}</button></header>
      <div class="drawer-body">
        <h3>${post.title}</h3>
        <p>${post.desc} 本作品记录了完整创作过程，欢迎留下你的想法。</p>
        <div class="tag-line">${post.tags.map((tag) => `<span>#${tag}</span>`).join('')}</div>
        <div class="character-link"><img src="assets/pixel.jpg" alt="关联角色"><div><strong>关联角色 · 星雾</strong><span>查看 OC 角色档案</span></div>${icon('chevron-right')}</div>
        ${state.comments.map((comment) => `<article class="comment"><img src="assets/avatar.jpg" alt=""><div><strong>${escapeHtml(comment.author)}</strong><p>${escapeHtml(comment.text)}</p></div><button title="喜欢评论">${icon('heart')}<small>${comment.likes}</small></button></article>`).join('')}
      </div>
      <form class="drawer-input" data-form="comment"><input id="comment-input" maxlength="200" placeholder="友善交流，分享你的感受" aria-label="评论内容"><button type="submit">发送</button></form>
    </section>
  </div>`;
}

function shareSheet(downloadLocked) {
  return `<div class="sheet" data-action="close-share">
    <section class="sheet-panel" role="dialog" aria-modal="true" aria-label="分享与更多操作">
      <div class="sheet-handle"></div>
      <strong>分享至</strong>
      <div class="share-grid">
        <button data-action="share-channel" data-message="已打开微信分享"><span>${icon('message-circle')}</span><span>微信好友</span></button>
        <button data-action="share-channel" data-message="已复制作品链接"><span>${icon('link')}</span><span>复制链接</span></button>
        <button data-action="share-channel" data-message="分享图生成中"><span>${icon('wand-sparkles')}</span><span>生成分享图</span></button>
        <button data-action="download" ${downloadLocked ? 'disabled' : ''}><span>${icon('download')}</span><span>下载</span></button>
        <button data-action="toast" data-message="已进入举报流程"><span>${icon('flag')}</span><span>举报</span></button>
        <button data-action="toast" data-message="已减少此类内容推荐"><span>${icon('circle-slash-2')}</span><span>不感兴趣</span></button>
      </div>
      <p class="sheet-note">${downloadLocked ? '作者未开放下载，仅可分享作品链接。' : '下载审核通过的最高可用清晰度版本。'}</p>
    </section>
  </div>`;
}

function publishScreen() {
  const post = currentPost();
  return `<section class="screen publish-screen">
    <header class="simple-topbar"><button class="icon-btn" data-action="back" title="返回">${icon('chevron-left')}</button><h1>发布视频</h1><button class="text-action" data-action="save-draft">存草稿</button></header>
    <div class="scroll-area publish-body">
      <section class="media-editor">
        <button data-action="replace-media" title="更换视频"><img src="${post.image}" alt="已选择视频"><span>${icon('refresh-cw')}</span></button>
        <div class="media-fields">
          <input id="publish-title" maxlength="20" value="新角色设定过程记录" placeholder="作品标题" aria-label="作品标题">
          <textarea id="publish-description" maxlength="1000" placeholder="添加创作描述" aria-label="创作描述">从草稿、配色到成稿，记录这次角色设定的完整过程。</textarea>
          <span class="field-count"><b id="description-count">27</b>/1000</span>
        </div>
      </section>
      <section class="publish-section">
        <span class="section-label">内容标签</span>
        <div class="chip-row"><button class="chip active">#OC角色档案</button><button class="chip">#绘画过程</button><button class="chip">+ 添加标签</button></div>
      </section>
      <section class="settings-list">
        <button class="setting-row" data-action="toast" data-message="已打开角色选择"><span>${icon('at-sign')}</span><span>关联角色</span><small>星雾</small>${icon('chevron-right')}</button>
        <button class="setting-row" data-action="toast" data-message="已打开创作声明"><span>${icon('file-badge')}</span><span>创作声明</span><small>原创</small>${icon('chevron-right')}</button>
        <div class="setting-row"><span>${icon('bot')}</span><span>作品包含 AI 生成技术</span><button class="toggle ${state.aiDisclosure ? 'on' : ''}" data-action="toggle-ai" aria-label="AI生成声明"></button></div>
        <div class="setting-row"><span>${icon('download')}</span><span>允许他人下载</span><button class="toggle ${state.downloadEnabled ? 'on' : ''}" data-action="toggle-download" aria-label="下载权限"></button></div>
        <button class="setting-row" data-action="toast" data-message="可见范围：公开"><span>${icon('globe-2')}</span><span>谁可以看</span><small>公开</small>${icon('chevron-right')}</button>
      </section>
      <button class="publish-submit" data-action="start-publish">发布</button>
    </div>
    ${bottomNav('publish')}
    ${state.publishStage !== 'idle' ? processModal() : ''}
    ${state.toast ? `<div class="toast">${state.toast}</div>` : ''}
  </section>`;
}

function processModal() {
  const config = {
    upload: ['cloud-upload', '正在上传', '已上传 68%，离开页面后将在后台继续', 1],
    processing: ['settings-2', '视频处理中', '正在生成多清晰度播放版本', 2],
    reviewing: ['shield-check', '内容审核中', '审核通过后将自动发布', 3],
    success: ['check', '发布成功', '作品已进入社区分发', 3],
    failed: ['triangle-alert', '审核未通过', '视频 00:12 处可能包含不适宜内容，请修改后重新发布', 3]
  }[state.publishStage];
  return `<div class="process-modal"><section class="process-card" role="dialog" aria-modal="true">
    <div class="process-icon">${icon(config[0])}</div><h3>${config[1]}</h3><p>${config[2]}</p>
    <div class="stage-track">${[1,2,3].map((item) => `<span class="${item <= config[3] ? 'done' : ''}"></span>`).join('')}</div>
    ${['success', 'failed'].includes(state.publishStage) ? `<button class="secondary" data-action="finish-publish">${state.publishStage === 'success' ? '查看作品' : '返回修改'}</button>` : `<button class="secondary" data-action="background-publish">后台继续</button>`}
  </section></div>`;
}

function profileScreen() {
  return `<section class="screen profile-screen">
    <div class="scroll-area">
      <section class="profile-hero">
        <img class="profile-cover" src="assets/sea.jpg" alt="个人主页背景"><div class="profile-scrim"></div>
        <div class="profile-nav"><button class="icon-btn" data-action="back" title="返回">${icon('chevron-left')}</button><button class="icon-btn" data-action="toast" data-message="已打开个人主页设置" title="设置">${icon('menu')}</button></div>
        <div class="profile-id"><img src="assets/avatar.jpg" alt="绘绘子"><div><h2>绘绘子 · SVIP</h2><p>把每一次灵感都画成故事</p></div></div>
      </section>
      <section class="profile-stats"><div><strong>36</strong><span>关注</span></div><div><strong>7,284</strong><span>粉丝</span></div><div><strong>8.8万</strong><span>获赞</span></div></section>
      <nav class="profile-tabs"><button class="active">已发布</button><button>草稿箱</button><button>角色卡</button><button>赞过</button><button>收藏</button></nav>
      <section class="profile-grid">
        ${posts.filter((post) => post.media === 'video').map((post, order) => {
          const index = posts.indexOf(post);
          return `<article class="profile-card">
            <button class="main-card" data-action="open-detail" data-index="${index}"><img src="${post.image}" alt="${post.title}"><span class="view-count">${icon('eye')} ${post.views}</span>${order === 0 ? '<span class="pin-badge">置顶</span>' : ''}<div class="profile-card-body"><strong>${post.title}</strong><span>${post.likes} 人喜欢</span></div></button>
            <button class="card-more" data-action="manage" title="管理作品">${icon('more-horizontal')}</button>
          </article>`;
        }).join('')}
      </section>
    </div>
    ${bottomNav('profile')}
    ${state.manageMenu ? `<div class="manage-menu"><button data-action="manage-action" data-message="置顶状态已更新">${icon('pin')} 置顶/取消置顶</button><button data-action="manage-action" data-message="已进入文字编辑">${icon('pencil')} 编辑文字信息</button><button data-action="manage-action" data-message="下载权限已更新">${icon('download')} 修改下载权限</button><button data-action="manage-action" data-message="删除需要二次确认">${icon('trash-2')} 删除作品</button></div>` : ''}
    ${state.toast ? `<div class="toast">${state.toast}</div>` : ''}
  </section>`;
}

function render() {
  if (state.screen === 'detail') app.innerHTML = detailScreen();
  else if (state.screen === 'publish') app.innerHTML = publishScreen();
  else if (state.screen === 'profile') app.innerHTML = profileScreen();
  else app.innerHTML = state.variant === 'B' ? homeB() : state.variant === 'C' ? homeC() : homeA();
  if (window.lucide) lucide.createIcons();
  updatePrototypeChrome();
  bindSwipe();
}

function updatePrototypeChrome() {
  document.querySelector('#variant-label').textContent = `${state.variant} · ${variantNames[state.variant]}`;
  document.querySelector('#scenario-select').value = state.scenario;
  const labels = { home: '首页', detail: '视频详情', publish: '发布页', profile: '个人主页' };
  document.querySelector('#state-title').textContent = `${labels[state.screen]} · ${variantNames[state.variant]}`;
  const entries = [
    ['页面', labels[state.screen]], ['方案', state.variant], ['播放', state.playing ? '播放中' : '暂停'],
    ['详情抽屉', state.drawer ? '展开' : '收起'], ['场景', state.scenario], ['发布状态', state.publishStage]
  ];
  document.querySelector('#state-list').innerHTML = entries.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('');
}

function showToast(message) {
  clearTimeout(toastTimer);
  state.toast = message;
  render();
  toastTimer = setTimeout(() => { state.toast = ''; render(); }, 1800);
}

function formatTime(percent, total) {
  const parts = total.split(':').map(Number);
  const seconds = (parts[0] * 60 + parts[1]) * percent / 100;
  return `00:${String(Math.floor(seconds)).padStart(2, '0')}`;
}

function setVariant(next) {
  state.variant = next;
  if (location.protocol !== 'file:') {
    const params = new URLSearchParams(location.search);
    params.set('variant', next);
    history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
  }
  render();
}

function cycleVariant(direction) {
  const variants = ['A', 'B', 'C'];
  const index = variants.indexOf(state.variant);
  setVariant(variants[(index + direction + variants.length) % variants.length]);
}

function openDetail(index) {
  let target = Number(index);
  if (posts[target]?.media !== 'video') target = posts.findIndex((post) => post.media === 'video');
  state.postIndex = target;
  state.screen = 'detail';
  state.playing = true;
  state.progress = 0;
  state.drawer = false;
  state.share = false;
  render();
}

function clearPublishTimers() {
  publishTimers.forEach(clearTimeout);
  publishTimers = [];
}

function startPublish() {
  clearPublishTimers();
  state.publishStage = 'upload';
  render();
  publishTimers.push(setTimeout(() => { state.publishStage = 'processing'; render(); }, 1100));
  publishTimers.push(setTimeout(() => { state.publishStage = 'reviewing'; render(); }, 2300));
  publishTimers.push(setTimeout(() => { state.publishStage = state.scenario === 'audit-fail' ? 'failed' : 'success'; render(); }, 3600));
}

function nextVideo(direction) {
  const videoIndexes = posts.map((post, index) => post.media === 'video' ? index : -1).filter((index) => index >= 0);
  const current = videoIndexes.indexOf(state.postIndex);
  state.postIndex = videoIndexes[(current + direction + videoIndexes.length) % videoIndexes.length];
  state.progress = 0;
  state.playing = true;
  render();
}

function bindSwipe() {
  const target = document.querySelector('[data-swipe="video"]');
  if (!target) return;
  let startY = 0;
  target.addEventListener('touchstart', (event) => { startY = event.touches[0].clientY; }, { passive: true });
  target.addEventListener('touchend', (event) => {
    const distance = startY - event.changedTouches[0].clientY;
    if (Math.abs(distance) > 60) nextVideo(distance > 0 ? 1 : -1);
  }, { passive: true });
}

app.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'go-home') { state.screen = 'home'; state.playing = false; render(); }
  else if (action === 'go-profile') { state.screen = 'profile'; state.playing = false; render(); }
  else if (action === 'go-publish') { state.screen = 'publish'; state.playing = false; state.publishStage = 'idle'; render(); }
  else if (action === 'back') { state.screen = state.screen === 'detail' ? 'home' : 'home'; state.playing = false; state.drawer = false; render(); }
  else if (action === 'feed-tab') { state.activeTab = target.dataset.tab; render(); }
  else if (action === 'category') { state.category = target.dataset.category; render(); }
  else if (action === 'open-detail') openDetail(target.dataset.index);
  else if (action === 'toggle-play') { state.playing = !state.playing; render(); }
  else if (action === 'toggle-like') { state.liked = !state.liked; render(); }
  else if (action === 'toggle-save') { state.saved = !state.saved; render(); }
  else if (action === 'toggle-follow') { state.following = !state.following; render(); }
  else if (action === 'open-drawer') { state.drawer = true; render(); }
  else if (action === 'close-drawer') { if (event.target.closest('.drawer-panel') && !event.target.closest('.drawer-head .icon-btn')) return; state.drawer = false; render(); }
  else if (action === 'open-share') { state.share = true; render(); }
  else if (action === 'close-share') { if (event.target.closest('.sheet-panel')) return; state.share = false; render(); }
  else if (action === 'share-channel') { state.share = false; showToast(target.dataset.message); }
  else if (action === 'download') { state.share = false; showToast('下载中 0%'); setTimeout(() => showToast('已保存至本地相册'), 1100); }
  else if (action === 'toast') showToast(target.dataset.message || '功能状态已更新');
  else if (action === 'replace-media') showToast('已更换视频，原上传进度已清除');
  else if (action === 'save-draft') showToast('草稿已保存');
  else if (action === 'toggle-ai') { state.aiDisclosure = !state.aiDisclosure; render(); }
  else if (action === 'toggle-download') { state.downloadEnabled = !state.downloadEnabled; render(); }
  else if (action === 'start-publish') startPublish();
  else if (action === 'background-publish') { state.publishStage = 'idle'; showToast('任务将在后台继续'); }
  else if (action === 'finish-publish') { const failed = state.publishStage === 'failed'; state.publishStage = 'idle'; state.screen = failed ? 'publish' : 'profile'; render(); }
  else if (action === 'manage') { state.manageMenu = !state.manageMenu; render(); }
  else if (action === 'manage-action') { state.manageMenu = false; showToast(target.dataset.message); }
});

app.addEventListener('submit', (event) => {
  if (event.target.dataset.form !== 'comment') return;
  event.preventDefault();
  const input = document.querySelector('#comment-input');
  const value = input.value.trim();
  if (!value) return showToast('请输入评论内容');
  state.comments.unshift({ author: '绘绘子', text: value, likes: 0 });
  render();
  setTimeout(() => document.querySelector('#comment-input')?.focus(), 0);
});

app.addEventListener('input', (event) => {
  if (event.target.id === 'publish-description') {
    const count = document.querySelector('#description-count');
    if (count) count.textContent = event.target.value.length;
  }
});

document.querySelector('.prototype-switcher').addEventListener('click', (event) => {
  const target = event.target.closest('[data-prototype-action]');
  if (!target) return;
  cycleVariant(target.dataset.prototypeAction === 'next' ? 1 : -1);
});

document.querySelector('#scenario-select').addEventListener('change', (event) => {
  state.scenario = event.target.value;
  render();
});

document.addEventListener('keydown', (event) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
  if (event.key === 'ArrowLeft') cycleVariant(-1);
  if (event.key === 'ArrowRight') cycleVariant(1);
});

setInterval(() => {
  if (state.screen !== 'detail' || !state.playing) return;
  state.progress = Math.min(100, state.progress + (state.scenario === 'weak' ? .35 : .7));
  const bar = document.querySelector('#play-progress');
  const time = document.querySelector('#play-time');
  if (bar) bar.style.setProperty('--progress', `${state.progress}%`);
  if (time) time.textContent = formatTime(state.progress, currentPost().duration);
  updatePrototypeChrome();
  if (state.progress >= 100) nextVideo(1);
}, 500);

render();
