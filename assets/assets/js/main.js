(function () {
  var main = document.querySelector('main.snap');
  var sections = [].slice.call(document.querySelectorAll('.section'));
  var dots = [].slice.call(document.querySelectorAll('.dotnav a'));
  var pills = [].slice.call(document.querySelectorAll('.pillnav a'));
  var bar = document.querySelector('.progress__bar');
  var stories = [].slice.call(document.querySelectorAll('.story'));
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function vh() { return main.clientHeight; }
  function isMobile() { return window.innerWidth < 1024; }

  // 활성 섹션(dot) + 진행바
  function updateActive() {
    var probe = main.scrollTop + vh() * 0.5;
    var idx = 0;
    for (var i = 0; i < sections.length; i++) { if (sections[i].offsetTop <= probe) idx = i; }
    dots.forEach(function (d, j) { d.classList.toggle('is-active', j === idx); });
    // 플로팅 필: 현재 섹션 id 이하의 마지막 필을 활성화
    var curId = sections[idx] ? sections[idx].id : '';
    var pillIdx = -1;
    pills.forEach(function (p, k) {
      if (p.getAttribute('data-sec') === curId) pillIdx = k;
    });
    if (pillIdx === -1) {
      // 표지 등 필에 없는 섹션이면 현재 위치 이전의 가장 가까운 필 유지
      for (var k = 0; k < pills.length; k++) {
        var sec = document.getElementById(pills[k].getAttribute('data-sec'));
        if (sec && sec.offsetTop <= main.scrollTop + vh() * 0.5) pillIdx = k;
      }
    }
    pills.forEach(function (p, k) { p.classList.toggle('is-active', k === pillIdx); });
    if (bar) {
      var max = main.scrollHeight - main.clientHeight;
      bar.style.width = (max > 0 ? (main.scrollTop / max * 100) : 0) + '%';
    }
  }

  // 시안 스크롤리텔링: 진행도에 따라 강조 영역 하이라이트 + 목업 패닝 + 단계 코멘트
  function updateStories() {
    var v = vh();
    stories.forEach(function (story) {
      var img = story.querySelector('.story__img');
      var hl = story.querySelector('.story__hl');
      var frame = story.querySelector('.story__viz');
      var steps = [].slice.call(story.querySelectorAll('.story__step'));
      if (isMobile()) {
        img.style.transform = '';
        steps.forEach(function (s) { s.classList.add('is-on'); });
        if (hl) hl.style.opacity = 0;
        return;
      }
      var imgH = img.offsetHeight;
      if (!imgH) return; // 이미지 로드 전
      var N = steps.length;
      // 각 단계는 한 화면(스냅 지점)마다 하나 — 스냅된 위치로 활성 단계 결정
      var active = clamp(Math.round((main.scrollTop - story.offsetTop) / v), 0, N - 1);
      steps.forEach(function (s, i) { s.classList.toggle('is-on', i === active); });

      var inView = (main.scrollTop + v > story.offsetTop) &&
                   (main.scrollTop < story.offsetTop + story.offsetHeight);
      var ds = steps[active];
      var rTop = parseFloat(ds.getAttribute('data-top'));
      var rH = parseFloat(ds.getAttribute('data-height'));
      var frameH = frame.clientHeight;
      var center = (rTop + rH / 2) / 100 * imgH;
      var ty = clamp(frameH / 2 - center, frameH - imgH, 0);
      img.style.transform = 'translateY(' + ty + 'px)';
      hl.style.top = ((rTop / 100) * imgH + ty) + 'px';
      hl.style.height = ((rH / 100) * imgH) + 'px';
      hl.style.opacity = inView ? 1 : 0;
    });
  }

  function onScroll() { updateActive(); updateStories(); }
  main.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { updateStories(); updateActive(); });

  // dot / 플로팅 필 클릭 이동
  dots.concat(pills).forEach(function (d) {
    d.addEventListener('click', function (ev) {
      ev.preventDefault();
      var t = document.querySelector(d.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // 라이트박스 (목업 전체 확대)
  var lb = document.getElementById('lightbox');
  var lbImg = lb.querySelector('.lightbox__img');
  var lbClose = lb.querySelector('.lightbox__close');
  var lastTrigger = null;
  function openLB(src, alt) { lbImg.src = src; lbImg.alt = alt; lb.hidden = false; lbClose.focus(); }
  function closeLB() { lb.hidden = true; lbImg.src = ''; if (lastTrigger) { lastTrigger.focus(); } }
  document.addEventListener('click', function (ev) {
    var z = ev.target.closest('[data-zoom]');
    if (z) { lastTrigger = z; openLB(z.getAttribute('src') || z.dataset.zoom, z.getAttribute('alt') || ''); }
  });
  lbClose.addEventListener('click', closeLB);
  lb.addEventListener('click', function (ev) { if (ev.target === lb) closeLB(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !lb.hidden) closeLB(); });

  // 시안 패널(우측 텍스트) 호버 시 '스크롤' 커서 표시
  var scrollCur = document.createElement('div');
  scrollCur.className = 'scrollcursor';
  scrollCur.innerHTML = '<i class="sc-ar">∧</i><span>스크롤</span><i class="sc-ar">∨</i>';
  document.body.appendChild(scrollCur);
  function placeCur(e) { scrollCur.style.left = e.clientX + 'px'; scrollCur.style.top = e.clientY + 'px'; }
  [].slice.call(document.querySelectorAll('.story__panel')).forEach(function (panel) {
    panel.addEventListener('mouseenter', function (e) {
      if (isMobile()) return;
      placeCur(e); scrollCur.classList.add('is-on'); document.body.classList.add('hide-cursor');
    });
    panel.addEventListener('mousemove', function (e) { if (!isMobile()) placeCur(e); });
    panel.addEventListener('mouseleave', function () {
      scrollCur.classList.remove('is-on'); document.body.classList.remove('hide-cursor');
    });
  });

  // 시안 좌측(목업 이미지) 호버 시 '시안 원본 보기' 커서 표시
  var viewCur = document.createElement('div');
  viewCur.className = 'viewcursor';
  viewCur.innerHTML = '<span>시안 원본 보기</span><i class="vc-ar">→</i>';
  document.body.appendChild(viewCur);
  function placeView(e) { viewCur.style.left = e.clientX + 'px'; viewCur.style.top = e.clientY + 'px'; }
  [].slice.call(document.querySelectorAll('.story__viz')).forEach(function (viz) {
    viz.addEventListener('mouseenter', function (e) {
      if (isMobile()) return;
      placeView(e); viewCur.classList.add('is-on'); document.body.classList.add('hide-cursor-viz');
    });
    viz.addEventListener('mousemove', function (e) { if (!isMobile()) placeView(e); });
    viz.addEventListener('mouseleave', function () {
      viewCur.classList.remove('is-on'); document.body.classList.remove('hide-cursor-viz');
    });
  });

  // 초기화 (이미지 로드 후 offsetHeight 확보)
  window.addEventListener('load', function () { updateStories(); updateActive(); });
  updateActive();
})();
