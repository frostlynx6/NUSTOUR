(() => {
  const dictionaries = {
    en: {
      'nav.main': 'Main Page',
      'nav.about': 'About NUS Tour',
      'nav.book': 'Book Now',
      'lang.label': 'Language',
      'lang.en': 'EN',
      'lang.cn': 'CN',

      'hero.title': 'Explore NUS with NUSTOUR',
      'hero.title_html': 'Explore NUS with <span class="brand-text"><span class="nus">NUS</span> <span class="tour">TOUR</span></span>',
      'hero.desc': 'Discover the National University of Singapore through curated, student-led tours designed for visitors and tourists.',
      'hero.bookNow': 'Book Now',
      'hero.about': 'About NUS Tour',
      'docent.title': 'Official Licensed Student Docent',
      'disclaimer': 'Disclaimer: Any opinion or information on this website does not represent NUS.',

      'features.1.title': 'Guided Campus Highlights',
      'features.1.desc': 'See iconic landmarks, faculties, and hidden gems across the campus with friendly, knowledgeable student docents.',
      'features.2.title': 'Simple Weekday Scheduling',
      'features.2.desc': 'Weekday tours, hourly slots between 9am and 4pm. Reserve, pay, and upload proof easily.',
      'features.3.title': 'Small Group Experience',
      'features.3.desc': 'Minimum 5 adult-equivalent participants to begin, capped at 20 pax per tour for comfort.',

      'about.title': 'About NUS Tour',
      'about.title_html': 'About <span class="brand-text"><span class="nus">NUS</span> <span class="tour">TOUR</span></span>',
      'nav.about_html': 'About <span class="brand-text"><span class="nus">NUS</span> <span class="tour">TOUR</span></span>',
      'about.intro.title': 'Introduction',
      'about.intro.text': 'Welcome to NUS TOUR! Here is where you get an opportunity to explore around the top university in Asia -- NUS! Join now to experience a fully dedicated school tour just for you!',
      'about.how.title': 'How to Book',
      'about.how.1': 'Simply go to Book Now, choose the date and time you wish to make a visit!',
      'about.how.2': 'A minimum of 5 Adult or equivalent children is required to start the tour (1 Adult = 2 Children), with AT LEAST 1 Adult required to be present.',
      'about.how.3': 'There can be a maximum of only 20 person (No matter Adult or Children) per tour.',
      'about.how.4': 'After confirming your slot, enter your email and you will be directed to pay the confirmation fee of $5 per person. Please pay and upload proof of payment.',
      'about.how.5': 'You will receive an email once the booking is confirmed. Further details will be sent via email.',
      'about.price.title': 'Pricing',
      'about.price.confirmation': 'Confirmation Fee',
      'about.price.perPerson': '$5 per person',
      'about.price.ae': 'Adult Equivalent: 1 Adult = 2 Children',
      'about.price.group': 'Group Size: Minimum 5 AE, Maximum 20 pax',

      'book.title': 'Book Now',
      'calendar.choose': 'Choose a date (next 3 weeks)',
      'calendar.hint': 'Weekdays only. Locked days are unavailable.',
      'legend.confirmed': 'Confirmed',
      'legend.reserved': 'Reserved',
      'legend.available': 'Available',
      'legend.aeNote': 'AE = Adult Equivalent (1 Adult = 2 Children)',
      'selected.prefix': 'Selected:',

      'slot.reserve': 'Reserve',
      'stats.confirmed': 'Confirmed: {n}',
      'stats.reserved': 'Reserved: {n}',
      'stats.available': 'Available: {n}',
      'slot.needed': 'Still needed to start: {n} AE',

      'reserve.title': 'Reserve Slot',
      'reserve.date': 'Date',
      'reserve.time': 'Time',
      'reserve.adults': 'Adults',
      'reserve.children': 'Children',
      'reserve.name': 'Full Name',
      'reserve.email': 'Email',
      'reserve.note': 'Minimum 5 Adult-Equivalents (AE) to start. 1 Adult = 2 Children.',
      'btn.cancel': 'Cancel',
      'btn.continue': 'Continue',

      'upload.title': 'Pay & Upload Proof',
      'upload.label': 'Upload payment proof',
      'upload.hint': '$5 per person',
      'btn.back': 'Back',
      'btn.submitProof': 'Submit Proof',
      'status.submitting': 'Submitting...',
      'status.submitted': 'Submitted! Your slot is reserved for 48 hours pending verification.',
      'status.error': 'Error submitting proof. Please try again.',

      'status.locked': 'Locked',
      'status.weekend': 'Weekend',
      'status.full': 'Full',

      'alerts.adultRequired': 'At least 1 Adult is required to be present.',
      'alerts.onlyLeft': 'Only {n} slots left for this time.',
      'alerts.uploadProof': 'Please upload a payment proof.',

      'timepicker.title': 'Choose a Time',

      'admin.panelTitle': 'Admin Panel',
      'admin.enterKey': 'Enter Admin Key',
      'admin.useKey': 'Use Key',
      'admin.lockTitle': 'Lock/Unlock Dates (next 3 weeks)',
      'admin.selectToggle': 'Select to toggle lock',
      'admin.resFor': 'Reservations for',
      'admin.noReservations': 'No reservations.',
      'admin.confirm': 'Confirm',
      'admin.delete': 'Delete',
      'admin.keySaved': 'Admin key saved for this session.',
      'admin.failedToggle': 'Failed to toggle lock',
      'admin.failedLoad': 'Failed to load.',
      'admin.failedAction': 'Failed',
      'admin.login.title': 'Admin Login',
      'admin.login.password': 'Admin Password',
      'admin.login.signIn': 'Sign In',
      'admin.login.badKey': 'Invalid admin key. Please try again.',

      'receipt.title': 'Receipt',
      'receipt.adults': 'Adults',
      'receipt.children': 'Children',
      'receipt.subtotal': 'Subtotal',
      'receipt.total': 'Total'
    },
    cn: {
      'nav.main': '主页',
      'nav.about': '关于NUS参观',
      'nav.book': '立即预订',
      'lang.label': '语言',
      'lang.en': '英文',
      'lang.cn': '中文',

      'hero.title': '与 NUSTOUR 一起探索 NUS',
        'hero.title_html': '跟随 <span class="brand-text"><span class="nus">NUS</span> <span class="tour">TOUR</span></span> 一起探索新加坡国立大学',
      'hero.desc': '通过由学生带领的精心策划参观，探索新加坡国立大学（NUS）。',
      'hero.bookNow': '立即预订',
      'hero.about': '关于参观',
      'docent.title': '官方认证 学生讲解员',
      'disclaimer': '免责声明：本网站的任何观点或信息均不代表新加坡国立大学。',

      'features.1.title': '校园亮点导览',
      'features.1.desc': '由友好且熟悉校园的学生讲解员带你走访地标、学院与隐藏景点。',
      'features.2.title': '简便的工作日预约',
      'features.2.desc': '工作日 9am–4pm 整点时段。轻松预约、支付并上传凭证。',
      'features.3.title': '小而精的体验',
      'features.3.desc': '至少 5 名成人当量（AE）即可开团，单团最多 20 人。',

      'about.title': '关于 NUS 参观',
      'about.title_html': '关于 <span class="brand-text"><span class="nus">NUS</span> <span class="tour">TOUR</span></span>',
      'nav.about_html': '关于 <span class="brand-text"><span class="nus">NUS</span> <span class="tour">TOUR</span></span>',
      'about.intro.title': '简介',
      'about.intro.text': '欢迎来到 NUS TOUR！这里让你有机会探索亚洲顶尖大学——NUS！立即加入，体验为你量身定制的校园参观！',
      'about.how.title': '如何预订',
      'about.how.1': '前往 “立即预订”，选择你想参观的日期与时间！',
      'about.how.2': '至少需 5 名成人或等额儿童（1 成人 = 2 儿童）方可开团，且至少需 1 名成人在场。',
      'about.how.3': '每团最多 20 人（成人或儿童均计入）。',
      'about.how.4': '确认时段后输入邮箱并支付每人 5 新元的确认费，然后上传支付凭证。',
      'about.how.5': '预订确认后你将收到邮件通知，更多细节将通过邮件发送。',
      'about.price.title': '价目',
      'about.price.confirmation': '确认费',
      'about.price.perPerson': '每人 5 新元',
      'about.price.ae': '成人当量：1 成人 = 2 儿童',
      'about.price.group': '团队规模：至少 5 AE，至多 20 人',

      'book.title': '立即预订',
      'calendar.choose': '选择日期（未来 3 周）',
      'calendar.hint': '仅限工作日。锁定日期不可预订。',
      'legend.confirmed': '已确认',
      'legend.reserved': '已预留',
      'legend.available': '可用',
      'legend.aeNote': 'AE = 成人当量（1 成人 = 2 儿童）',
      'selected.prefix': '已选择：',

      'slot.reserve': '预留',
      'stats.confirmed': '已确认：{n}',
      'stats.reserved': '已预留：{n}',
      'stats.available': '可用：{n}',
      'slot.needed': '距成团仍需：{n} AE',

      'reserve.title': '预留时段',
      'reserve.date': '日期',
      'reserve.time': '时间',
      'reserve.adults': '成人',
      'reserve.children': '儿童',
      'reserve.name': '姓名',
      'reserve.email': '邮箱',
      'reserve.note': '成团需至少 5 AE。1 成人 = 2 儿童。',
      'btn.cancel': '取消',
      'btn.continue': '继续',

      'upload.title': '支付与上传凭证',
      'upload.label': '上传支付凭证',
      'upload.hint': '每人 5 新元',
      'btn.back': '返回',
      'btn.submitProof': '提交凭证',
      'status.submitting': '提交中…',
      'status.submitted': '已提交！你的名额将保留 48 小时，待核验后确认。',
      'status.error': '提交失败，请重试。',

      'status.locked': '已锁定',
      'status.weekend': '周末',
      'status.full': '已满',

      'alerts.adultRequired': '至少需 1 名成人在场。',
      'alerts.onlyLeft': '该时段仅剩 {n} 个名额。',
      'alerts.uploadProof': '请上传支付凭证。',

      'timepicker.title': '选择时间',

      'admin.panelTitle': '管理面板',
      'admin.enterKey': '输入管理员密钥',
      'admin.useKey': '使用密钥',
      'admin.lockTitle': '锁定/解锁日期（未来 3 周）',
      'admin.selectToggle': '点击以切换锁定状态',
      'admin.resFor': '预订列表',
      'admin.noReservations': '暂无预订。',
      'admin.confirm': '确认',
      'admin.delete': '删除',
      'admin.keySaved': '密钥已保存（本会话内）。',
      'admin.failedToggle': '切换锁定失败',
      'admin.failedLoad': '加载失败。',
      'admin.failedAction': '操作失败',
      'admin.login.title': '管理员登录',
      'admin.login.password': '管理员密码',
      'admin.login.signIn': '登录',
      'admin.login.badKey': '管理员密钥无效，请重试。',

      'receipt.title': '收据',
      'receipt.adults': '成人',
      'receipt.children': '儿童',
      'receipt.subtotal': '小计',
      'receipt.total': '合计'
    }
  };

  function format(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
  }

  const i18n = {
    getLang() {
      return localStorage.getItem('lang') || 'cn';
    },
    setLang(lang) {
      localStorage.setItem('lang', lang);
    },
    t(key, params) {
      const lang = i18n.getLang();
      const dict = dictionaries[lang] || dictionaries.en;
      const txt = dict[key] || dictionaries.en[key] || key;
      return format(txt, params);
    },
    apply(root=document) {
      const lang = i18n.getLang();
      // Update any [data-i18n]
      root.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = i18n.t(key);
      });
      // Update any [data-i18n-html]
      root.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        el.innerHTML = i18n.t(key);
      });
      // Update any [data-i18n-placeholder]
      root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.setAttribute('placeholder', i18n.t(key));
      });
      // Update title attributes for tooltips
      root.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.setAttribute('title', i18n.t(key));
      });
      // Update any options in selects
      root.querySelectorAll('[data-i18n-option]').forEach(opt => {
        const key = opt.getAttribute('data-i18n-option');
        opt.textContent = i18n.t(key);
      });
      // Update body dir or lang if needed
      document.documentElement.setAttribute('lang', lang === 'cn' ? 'zh' : 'en');
    }
  };

  window.NUSI18N = i18n;
})();
