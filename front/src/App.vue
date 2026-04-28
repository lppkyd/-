<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand__logo">W</div>
        <div>
          <h1>单词学习系统</h1>
          <p>后台管理端 V2.0</p>
        </div>
      </div>
      <nav class="menu">
        <button v-for="item in menus" :key="item.key" class="menu__item" :class="{ active: activeMenu === item.key }" @click="activeMenu = item.key">
          <span class="menu__icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </aside>

    <main class="main">
      <transition name="slide-fade">
        <div v-if="toast.show" class="toast" :class="`toast--${toast.type}`">
          {{ toast.message }}
        </div>
      </transition>

      <header class="topbar">
        <div>
          <div class="eyebrow">Word Learning Admin</div>
          <h2>{{ titleMap[activeMenu] }}</h2>
          <p>{{ descMap[activeMenu] }}</p>
        </div>
        <div class="topbar__actions">
          <button class="btn btn--ghost" @click="refreshData">刷新数据</button>
          <button class="btn btn--danger" @click="logout">退出登录</button>
        </div>
      </header>

      <section class="stats">
        <div class="stat-card" v-for="item in stats" :key="item.label">
          <div class="stat-card__value">{{ item.value }}</div>
          <div class="stat-card__label">{{ item.label }}</div>
        </div>
      </section>

      <section class="content-grid">
        <div class="panel panel--main">
          <div class="panel__head">
            <div>
              <h3>数据列表</h3>
            </div>
            <div class="panel__actions">
              <button v-if="activeMenu === 'category'" class="btn" @click="openForm('category')">+ 新增分类</button>
              <button v-if="activeMenu === 'dict'" class="btn" @click="openForm('dict')">+ 新增词典</button>
              <button v-if="activeMenu === 'word'" class="btn" @click="openForm('word')">+ 新增单词</button>
            </div>
          </div>

          <div v-if="activeMenu === 'dashboard'" class="dashboard">
            <div class="hero-card">
              <h3>欢迎回来，管理员</h3>
              <p>系统已升级至 V2.0。数据流与小程序完全打通，您可以直接在此管理所有核心资产。</p>
              <div class="hero-actions">
                <button class="btn" @click="activeMenu='user'">查看活跃用户</button>
                <button class="btn btn--ghost" @click="activeMenu='snapshot'">监控离线快照</button>
              </div>
            </div>
            <div class="quick-grid">
              <div class="quick-card" v-for="item in dashboardCards" :key="item.title">
                <h4>{{ item.title }}</h4>
                <p>{{ item.desc }}</p>
              </div>
            </div>
          </div>

          <div v-else class="table-section">
            <div class="search-row">
              <input v-model.trim="keyword" :placeholder="`搜索 ${titleMap[activeMenu]}...`">
              <button class="btn btn--ghost" @click="keyword=''">清空</button>
            </div>
            
            <div v-if="filteredRows.length === 0" class="empty-state">
              <div class="empty-icon">📭</div>
              <p>当前没有数据或搜索结果为空</p>
            </div>

            <table v-else class="table">
              <thead>
                <tr>
                  <th v-for="col in tableColumns" :key="col.key">{{ col.label }}</th>
                  <th>操作选项</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in filteredRows" :key="row.id + '-' + (row.syncedAt || '')">
                  <td v-for="col in tableColumns" :key="col.key">
                    <span v-if="col.key === 'syncedAt'">{{ formatTime(row[col.key]) }}</span>
                    <span v-else-if="col.key === 'recommended' || col.key === 'isCustom'">
                      <span class="badge" :class="row[col.key] ? 'badge--on' : 'badge--off'">{{ row[col.key] ? '是' : '否' }}</span>
                    </span>
                    <span v-else>{{ row[col.key] }}</span>
                  </td>
                  <td>
                    <button v-if="activeMenu === 'user'" class="link" @click="viewUser(row)">透视用户</button>
                    <button v-if="activeMenu === 'snapshot'" class="link" @click="viewSnapshot(row)">查看JSON</button>
                    <button v-if="['category', 'dict', 'word'].includes(activeMenu)" class="link" @click="openForm(activeMenu, row)">编辑</button>
                    <button v-if="activeMenu !== 'snapshot'" class="link danger" @click="deleteRow(row)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <aside class="panel panel--side">
          <div class="panel__head">
            <div>
              <h3>详情面板</h3>
              <p v-if="selectedUser">{{ selectedUser.nickname }} 的私有资产</p>
              <p v-else-if="selectedSnapshot">快照数据体</p>
              <p v-else>接口原始输出</p>
            </div>
            <button v-if="selectedUser" class="btn btn--small btn--ghost" @click="loadUserDetail(selectedUser.id)">更新面板</button>
          </div>

          <template v-if="selectedSnapshot">
            <div class="profile-card">
              <div class="avatar">S</div>
              <div>
                <h4>用户ID: {{ selectedSnapshot.userId }}</h4>
                <p>上报时间：{{ formatTime(selectedSnapshot.syncedAt) }}</p>
              </div>
            </div>
            <pre class="json snapshot-json">{{ selectedSnapshot.snapshot }}</pre>
            <button class="btn btn--ghost full-btn" @click="selectedSnapshot = null">关闭视图</button>
          </template>

          <template v-else-if="selectedUser">
            <div class="profile-card">
              <div class="avatar">{{ selectedUser.nickname ? selectedUser.nickname.slice(0,1) : 'U' }}</div>
              <div>
                <h4>{{ selectedUser.nickname }}</h4>
                <p>系统编号: {{ selectedUser.id }}</p>
              </div>
            </div>
            <div class="sub-card" v-for="block in userBlocks" :key="block.key">
              <div class="sub-card__head">
                <h4>{{ block.title }} ({{ block.rows.length }})</h4>
                <button class="btn btn--small danger" @click="clearSelectedUser(block.key)">清空全部</button>
              </div>
              <div class="list">
                <div class="list__row" v-for="item in block.rows.slice(0, 15)" :key="item.id">
                  <span>{{ item.label }}</span>
                  <button class="link danger" @click="deleteUserItem(block.key, item)">删</button>
                </div>
                <p v-if="block.rows.length > 15" class="empty">...等共 {{ block.rows.length }} 条记录</p>
                <p v-if="!block.rows.length" class="empty">该项为空</p>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="preview-status" :class="{'error-text': backendStatus==='接口异常'}">当前状态: {{ backendStatus }}</div>
            <pre class="json">{{ backendPreview }}</pre>
          </template>
        </aside>
      </section>

      <div v-if="showForm" class="modal-mask" @click.self="closeForm">
        <div class="modal">
          <h3>{{ formMode === 'create' ? '新增' : '编辑' }} {{ titleMap[formType] }}</h3>
          <div class="form-grid">
            <label v-for="field in currentFormFields" :key="field.key">
              <span>{{ field.label }}</span>
              <input v-model.trim="formData[field.key]" :placeholder="field.placeholder || ''">
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn btn--ghost" @click="closeForm">取消返回</button>
            <button class="btn" @click="submitForm">确认提交</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { request } from './utils/request'

export default {
  name: 'App',
  data() {
    return {
      activeMenu: 'dashboard', keyword: '', backendStatus: '未请求', backendPreview: '等待响应...',
      categories: [], dicts: [], words: [], users: [], studyRecords: [], favorites: [], errors: [], savedWords: [], snapshots: [],
      selectedUser: null, selectedFavorites: [], selectedErrors: [], selectedStudyRecords: [], selectedSavedWords: [], selectedSnapshot: null,
      showForm: false, formMode: 'create', formType: 'category', formData: {},
      toast: { show: false, message: '', type: 'success' },
      
      menus: [
        { key: 'dashboard', label: '概览监控', icon: '🏠' },
        { key: 'category', label: '分类大纲', icon: '📂' },
        { key: 'dict', label: '词典矩阵', icon: '📚' },
        { key: 'word', label: '元词总库', icon: '📘' },
        { key: 'user', label: '用户管理', icon: '👥' },
        { key: 'study', label: '学习轨迹', icon: '📈' },
        { key: 'favorite', label: '收藏留存', icon: '⭐' },
        { key: 'error', label: '错题收容', icon: '📝' },
        { key: 'saved', label: '离线生词', icon: '🧠' },
        { key: 'snapshot', label: '数据快照', icon: '☁️' },
      ],
      titleMap: { dashboard: '监控大屏', category: '分类大纲', dict: '词典矩阵', word: '元词总库', user: '用户管线', study: '学习轨迹', favorite: '收藏留存', error: '错题收容', saved: '离线生词', snapshot: '全量快照' },
      descMap: { dashboard: '全局数据与系统负载情况', category: '维护顶层单词分类', dict: '管理系统与自定义词典', word: '维护原子单词内容与释义', user: '查阅小程序授权用户信息', study: '用户章节打卡通过历史', favorite: '打字中标记的红心单词', error: '打错被记录的单词表', saved: '用户在生词本查词并保存的内容', snapshot: '小程序本地存储异步上报的备份' },
      dashboardCards: [
        { title: '资产管理', desc: '用户收藏、错题、生词记录的中央枢纽。' },
        { title: '词典扩充', desc: '构建系统词典或帮助用户管理私有词典。' },
        { title: '防丢失快照', desc: '即使小程序断网，数据也会自动上报到快照进行落库。' },
      ],
    }
  },
  computed: {
    stats() { return [{ label: '分类总数', value: this.categories.length }, { label: '词典总数', value: this.dicts.length }, { label: '单词总数', value: this.words.length }, { label: '注册用户', value: this.users.length }] },
    
    // 动态生成友好的中文表头
    tableColumns() {
      const configs = {
        category: [{key: 'id', label: '类目ID'}, {key: 'name', label: '分类名称'}, {key: 'sort', label: '权重排序'}],
        dict: [{key: 'id', label: '词典ID'}, {key: 'name', label: '词典名称'}, {key: 'description', label: '备注'}, {key: 'isCustom', label: '是否自建'}],
        word: [{key: 'id', label: '单词ID'}, {key: 'word', label: '英文单词'}, {key: 'meaning', label: '中文释义'}, {key: 'categoryId', label: '绑定的分类ID'}],
        user: [{key: 'id', label: '用户ID'}, {key: 'nickname', label: '用户昵称'}, {key: 'learnedCount', label: '已斩词数'}, {key: 'favoriteCount', label: '心标数'}, {key: 'wrongCount', label: '重灾区数'}],
        study: [{key: 'id', label: '记录ID'}, {key: 'userId', label: '所属用户ID'}, {key: 'categoryName', label: '完成章节'}, {key: 'accuracy', label: '击键准确率'}],
        favorite: [{key: 'id', label: '收藏ID'}, {key: 'userId', label: '持有用户ID'}, {key: 'word', label: '标记单词'}, {key: 'trans', label: '记录释义'}],
        error: [{key: 'id', label: '错题ID'}, {key: 'userId', label: '持有用户ID'}, {key: 'word', label: '阵亡单词'}, {key: 'wrongCount', label: '累积失误次数'}],
        saved: [{key: 'id', label: '生词ID'}, {key: 'userId', label: '持有用户ID'}, {key: 'word', label: '陌生词汇'}, {key: 'example', label: '应用例句'}],
        snapshot: [{key: 'userId', label: '上报用户ID'}, {key: 'syncedAt', label: '最后对齐时间'}]
      };
      return configs[this.activeMenu] || [];
    },

    filteredRows() {
      const sourceMap = { category: this.categories, dict: this.dicts, word: this.words, user: this.users, study: this.studyRecords, favorite: this.favorites, error: this.errors, saved: this.savedWords, snapshot: this.snapshots };
      const rows = sourceMap[this.activeMenu] || [];
      if (!this.keyword) return rows;
      return rows.filter(item => JSON.stringify(item).toLowerCase().includes(this.keyword.toLowerCase()));
    },

    currentFormFields() {
      if (this.formType === 'category') return [{ key: 'name', label: '分类标识 (如 CET4)' }, { key: 'sort', label: '排序数字 (默认0)' }];
      if (this.formType === 'dict') return [{ key: 'name', label: '词典标题' }, { key: 'description', label: '介绍描述' }, { key: 'isCustom', label: '是否为私有自建 (1是 0否)' }];
      if (this.formType === 'word') return [{ key: 'word', label: '单词主体' }, { key: 'meaning', label: '标准释义' }, { key: 'phonetic', label: '音标发音' }, { key: 'example', label: '典型例句' }, { key: 'categoryId', label: '所属分类的数字ID' }, { key: 'recommended', label: '是否星标推荐 (1是 0否)' }];
      return [];
    },
    
    userBlocks() {
      return [
        { key: 'favorites', title: '心标收藏', rows: this.selectedFavorites.map(i => ({ id: i.id, label: i.word })) },
        { key: 'errors', title: '错题记录', rows: this.selectedErrors.map(i => ({ id: i.id, label: `${i.word} (失误${i.wrongCount}次)` })) },
        { key: 'study', title: '打卡轨迹', rows: this.selectedStudyRecords.map(i => ({ id: i.id, label: `${i.categoryName} (${i.accuracy}%)` })) },
        { key: 'saved', title: '私有生词', rows: this.selectedSavedWords.map(i => ({ id: i.id, label: i.word })) }
      ];
    },
  },
  watch: {
    activeMenu(newMenu) { this.keyword = ''; this.loadDataForMenu(newMenu); }
  },
  methods: {
    showToastMsg(msg, type = 'success') {
      this.toast = { show: true, message: msg, type };
      setTimeout(() => { this.toast.show = false; }, 3000);
    },

    async loadDataForMenu(menu) {
      this.backendStatus = '加载中...';
      try {
        let res;
        switch(menu) {
          case 'dashboard':{
            const [uRes, dRes, cRes, wRes] = await Promise.all([request('/users'), request('/dicts'), request('/categories'), request('/words')]);
            this.users = uRes.data || []; this.dicts = dRes.data || []; this.categories = cRes.data || []; this.words = wRes.data || [];
            break;
          }
          case 'category': res = await request('/categories'); this.categories = res.data || []; break;
          case 'dict': res = await request('/dicts'); this.dicts = res.data || []; break;
          case 'word': res = await request('/words'); this.words = res.data || []; break;
          case 'user': res = await request('/users'); this.users = res.data || []; break;
          case 'study': res = await request('/study-records'); this.studyRecords = res.data || []; break;
          case 'favorite': res = await request('/favorites'); this.favorites = res.data || []; break;
          case 'error': res = await request('/errors'); this.errors = res.data || []; break;
          case 'saved': res = await request('/saved-words'); this.savedWords = res.data || []; break;
          case 'snapshot': res = await request('/sync/snapshot/latest'); this.snapshots = res.data || []; break;
        }
        this.backendStatus = '链路健康';
        this.backendPreview = res ? JSON.stringify(res, null, 2) : '大屏核心指标已对齐';
      } catch (error) {
        this.backendStatus = '接口异常';
        this.backendPreview = String(error);
        this.showToastMsg('数据拉取失败，请检查后端服务', 'error');
      }
    },

    async refreshData() {
      await this.loadDataForMenu(this.activeMenu);
      this.showToastMsg('数据已刷新');
    },

    formatTime(value) {
      if (!value) return '未知时间';
      const date = new Date(Number(value));
      return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
    },

    logout() { this.activeMenu = 'dashboard'; this.selectedUser = null; this.selectedSnapshot = null; this.showToastMsg('已退出'); },
    
    openForm(type, row = null) {
      this.formType = type; this.formMode = row ? 'edit' : 'create';
      this.formData = row ? { ...row } : {};
      this.showForm = true;
    },
    
    closeForm() { this.showForm = false; },

    viewUser(row) { this.selectedUser = row; this.selectedSnapshot = null; this.loadUserDetail(row.id); },
    
    async loadUserDetail(userId) {
      this.backendStatus = '抓取用户私有数据...';
      const [f, e, s, w] = await Promise.all([request(`/users/${userId}/favorites`), request(`/users/${userId}/errors`), request(`/users/${userId}/study-records`), request(`/users/${userId}/saved-words`)]);
      this.selectedFavorites = f.data || []; this.selectedErrors = e.data || []; this.selectedStudyRecords = s.data || []; this.selectedSavedWords = w.data || [];
      this.backendStatus = '抓取完成';
    },

    viewSnapshot(row) { this.selectedSnapshot = row; this.selectedUser = null; },

    async deleteRow(row) {
      if (!confirm(`将从数据库彻底抹除此记录 [ID:${row.id||'未知'}]，是否继续？`)) return;
      const routes = { category: '/categories', dict: '/dicts', word: '/words', user: `/users/${row.id}`, study: `/study-records/${row.id}`, favorite: `/favorites/${row.id}`, error: `/errors/${row.id}`, saved: `/saved-words/${row.id}` };
      const methods = { category: 'DELETE', dict: 'DELETE', word: 'DELETE', user: 'DELETE', study: 'DELETE', favorite: 'DELETE', error: 'DELETE', saved: 'DELETE' };
      try {
         await request(routes[this.activeMenu], { method: methods[this.activeMenu], body: JSON.stringify({ id: row.id }) });
         this.showToastMsg('记录已销毁');
         if (this.selectedUser && this.selectedUser.id === row.id) this.selectedUser = null;
         this.refreshData();
      } catch (err) { this.showToastMsg('销毁失败', 'error'); }
    },

    async clearSelectedUser(type) {
      if (!confirm('危险操作：这将清空该用户此类目的所有数据，不可逆！')) return;
      try {
        await request(`/users/${this.selectedUser.id}/clear-${type}`, { method: 'POST' });
        this.showToastMsg('已清空');
        await this.loadUserDetail(this.selectedUser.id);
        this.refreshData();
      } catch(err) { this.showToastMsg('清理失败', 'error'); }
    },

    async deleteUserItem(type, item) {
      const routes = { favorites: `/favorites/${item.id}`, errors: `/errors/${item.id}`, study: `/study-records/${item.id}`, saved: `/saved-words/${item.id}` };
      try {
        await request(routes[type], { method: 'DELETE' });
        this.loadUserDetail(this.selectedUser.id);
        this.refreshData();
      } catch(err) { this.showToastMsg('删除失败', 'error'); }
    },

    async submitForm() {
      try {
        const url = `/${this.formType === 'category' ? 'categories' : this.formType + 's'}`;
        const method = this.formMode === 'create' ? 'POST' : 'PUT';
        
        // 自动类型转换保证后端不报错
        const p = { ...this.formData, id: Number(this.formData.id || 0) };
        if(p.sort) p.sort = Number(p.sort);
        if(p.isCustom) p.isCustom = Boolean(Number(p.isCustom));
        if(p.categoryId) p.categoryId = Number(p.categoryId);
        if(p.recommended) p.recommended = Number(p.recommended);

        await request(url, { method, body: JSON.stringify(p) });
        this.showToastMsg('写入成功');
        this.closeForm();
        this.refreshData();
      } catch (error) { this.showToastMsg(`写入遭到拒绝：${error.message}`, 'error'); }
    },
  },
  mounted() { this.refreshData(); }
}
</script>

<style>
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Microsoft YaHei', sans-serif; background: #f0f4f8; color: #1e293b; }
button, input { font: inherit; }
.admin-shell { min-height: 100vh; display: grid; grid-template-columns: 260px 1fr; }
.sidebar { background: #0f172a; color: #f8fafc; padding: 24px 16px; display: flex; flex-direction: column; }
.brand { display: flex; gap: 14px; align-items: center; margin-bottom: 32px; padding: 0 8px; }
.brand__logo { width: 44px; height: 44px; border-radius: 12px; background: #3b82f6; display: grid; place-items: center; font-weight: 800; font-size: 20px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
.brand h1 { margin: 0; font-size: 18px; letter-spacing: 0.5px; }
.brand p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
.menu { display: grid; gap: 6px; }
.menu__item { display: flex; gap: 12px; align-items: center; border: 0; width: 100%; padding: 14px 18px; border-radius: 12px; background: transparent; color: #94a3b8; text-align: left; cursor: pointer; font-weight: 500; transition: all 0.2s; }
.menu__item.active, .menu__item:hover { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.menu__icon { font-size: 18px; }

.main { padding: 32px; position: relative; }
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.eyebrow { color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.topbar h2 { margin: 8px 0 4px; font-size: 28px; color: #0f172a; }
.topbar p { margin: 0; color: #64748b; font-size: 15px; }
.topbar__actions { display: flex; gap: 12px; }

.btn { border: 0; border-radius: 10px; padding: 10px 18px; background: #3b82f6; color: #fff; cursor: pointer; font-weight: 600; transition: background 0.2s; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25); }
.btn:hover { background: #2563eb; }
.btn--ghost { background: #fff; color: #475569; border: 1px solid #cbd5e1; box-shadow: none; }
.btn--ghost:hover { background: #f8fafc; color: #0f172a; border-color: #94a3b8; }
.btn--danger { background: #ef4444; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25); }
.btn--danger:hover { background: #dc2626; }
.btn--small { padding: 6px 12px; font-size: 13px; border-radius: 8px; }

.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,.02); border: 1px solid #e2e8f0; }
.stat-card__value { font-size: 32px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.stat-card__label { color: #64748b; font-weight: 500; }

.content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start; }
.panel { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,.02); border: 1px solid #e2e8f0; }
.panel__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
.panel__head h3 { margin: 0; font-size: 18px; color: #0f172a; }
.panel__head p { margin: 6px 0 0; color: #64748b; font-size: 14px; }

.search-row { display: flex; gap: 12px; margin-bottom: 16px; }
.search-row input, .form-grid input { width: 100%; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; background: #f8fafc; transition: all 0.2s; }
.search-row input:focus, .form-grid input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 0; color: #94a3b8; }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.6; }

.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th { padding: 14px 12px; border-bottom: 2px solid #e2e8f0; text-align: left; color: #64748b; font-weight: 600; white-space: nowrap; }
.table td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
.table tbody tr:hover { background: #f8fafc; }

.badge { padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.badge--on { background: #dcfce7; color: #0f5132; }
.badge--off { background: #f1f5f9; color: #64748b; }

.link { border: 0; background: transparent; color: #3b82f6; cursor: pointer; margin-right: 12px; font-weight: 500; font-size: 14px; padding: 0; }
.link:hover { text-decoration: underline; }
.link.danger { color: #ef4444; }

.dashboard { display: grid; gap: 20px; }
.hero-card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #fff; border-radius: 16px; padding: 28px; box-shadow: 0 10px 25px rgba(15,23,42,.2); }
.hero-card h3 { margin: 0 0 12px; font-size: 24px; }
.hero-card p { margin: 0; line-height: 1.6; color: #cbd5e1; font-size: 15px; }
.hero-actions { display: flex; gap: 12px; margin-top: 20px; }

.quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.quick-card { background: #f8fafc; border-radius: 14px; padding: 20px; border: 1px solid #e2e8f0; }
.quick-card h4 { margin: 0 0 8px; color: #0f172a; }
.quick-card p { margin: 0; color: #64748b; font-size: 13px; line-height: 1.5; }

.profile-card { display: flex; gap: 16px; align-items: center; padding: 16px; border-radius: 12px; background: #eff6ff; margin-bottom: 20px; border: 1px dashed #bfdbfe; }
.avatar { width: 56px; height: 56px; border-radius: 14px; background: #3b82f6; color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 22px; }
.profile-card h4 { margin: 0 0 4px; color: #1e3a8a; font-size: 18px; }
.profile-card p { margin: 0; color: #3b82f6; font-size: 13px; font-weight: 500; }

.sub-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,.02); }
.sub-card__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
.sub-card__head h4 { margin: 0; font-size: 15px; color: #334155; }
.list { display: grid; gap: 4px; }
.list__row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 13px; color: #475569; }
.empty { color: #94a3b8; font-size: 13px; margin: 8px 0 0; font-style: italic; }

.preview-status { margin-bottom: 12px; font-size: 13px; color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.preview-status::before { content: ''; display: block; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.error-text { color: #ef4444; }
.json { margin: 0; padding: 16px; background: #1e293b; color: #e2e8f0; border-radius: 12px; max-height: 600px; overflow: auto; font-family: 'Fira Code', Consolas, monospace; font-size: 13px; line-height: 1.5; }
.snapshot-json { max-height: 480px; }

.full-btn { width: 100%; margin-top: 16px; }

.modal-mask { position: fixed; inset: 0; background: rgba(15,23,42,.6); backdrop-filter: blur(4px); display: grid; place-items: center; z-index: 100; padding: 20px; }
.modal { width: min(500px, 100%); background: #fff; border-radius: 20px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,.25); }
.modal h3 { margin: 0 0 24px; font-size: 22px; color: #0f172a; }
.form-grid { display: grid; gap: 16px; }
.form-grid label { display: grid; gap: 8px; color: #475569; font-weight: 500; font-size: 14px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }

/* Toast 动画与样式 */
.toast { position: fixed; top: 32px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 30px; font-weight: 600; font-size: 14px; box-shadow: 0 10px 25px rgba(0,0,0,.1); z-index: 1000; display: flex; align-items: center; gap: 8px; }
.toast--success { background: #10b981; color: #fff; }
.toast--success::before { content: '✓'; }
.toast--error { background: #ef4444; color: #fff; }
.toast--error::before { content: '✕'; }
.slide-fade-enter-active, .slide-fade-leave-active { transition: all .3s ease; }
.slide-fade-enter, .slide-fade-leave-to { transform: translate(-50%, -20px); opacity: 0; }

@media (max-width: 1100px) { .admin-shell { grid-template-columns: 1fr; } .sidebar { display: none; } .content-grid { grid-template-columns: 1fr; } .stats, .quick-grid { grid-template-columns: 1fr; } .topbar { flex-direction: column; align-items: stretch; } }
</style>