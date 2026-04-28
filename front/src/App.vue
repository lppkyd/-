<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand__logo">W</div>
        <div>
          <h1>单词学习系统</h1>
          <p>后台管理端</p>
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
      <header class="topbar">
        <div>
          <div class="eyebrow">Word Learning Admin</div>
          <h2>{{ titleMap[activeMenu] }}</h2>
          <p>{{ descMap[activeMenu] }}</p>
        </div>
        <div class="topbar__actions">
          <button class="btn btn--ghost" @click="refreshData">刷新</button>
          <button class="btn btn--danger" @click="logout">退出</button>
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
              <h3>{{ titleMap[activeMenu] }}</h3>
              <p>{{ descMap[activeMenu] }}</p>
            </div>
            <div class="panel__actions">
              <button v-if="activeMenu === 'category'" class="btn" @click="openCategoryForm()">新增分类</button>
              <button v-if="activeMenu === 'word'" class="btn" @click="openWordForm()">新增单词</button>
            </div>
          </div>

          <div v-if="activeMenu === 'dashboard'" class="dashboard">
            <div class="hero-card">
              <h3>欢迎回来，管理员</h3>
              <p>这里可以统一管理分类、单词、用户、收藏、错题、学习记录和生词本。</p>
              <div class="hero-actions">
                <button class="btn" @click="activeMenu='user'">查看用户</button>
                <button class="btn btn--ghost" @click="activeMenu='snapshot'">查看快照</button>
              </div>
            </div>
            <div class="quick-grid">
              <div class="quick-card" v-for="item in dashboardCards" :key="item.title">
                <h4>{{ item.title }}</h4>
                <p>{{ item.desc }}</p>
              </div>
            </div>
          </div>

          <div v-else-if="activeMenu === 'user'" class="table-section">
            <div class="search-row">
              <input v-model.trim="keyword" placeholder="搜索用户昵称 / ID">
              <button class="btn btn--ghost" @click="keyword=''">清空</button>
            </div>
            <table class="table">
              <thead><tr><th>id</th><th>昵称</th><th>学会</th><th>收藏</th><th>错题</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="row in filteredUsers" :key="row.id">
                  <td>{{ row.id }}</td>
                  <td>{{ row.nickname }}</td>
                  <td>{{ row.learnedCount }}</td>
                  <td>{{ row.favoriteCount }}</td>
                  <td>{{ row.wrongCount }}</td>
                  <td><button class="link" @click="viewUser(row)">查看</button><button class="link danger" @click="deleteUser(row)">删除</button></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="table-section">
            <div class="search-row">
              <input v-model.trim="keyword" :placeholder="searchPlaceholder">
              <button class="btn btn--ghost" @click="keyword=''">清空</button>
            </div>
            <table class="table">
              <thead><tr><th v-for="head in tableHeads" :key="head">{{ head }}</th><th>操作</th></tr></thead>
              <tbody>
                <tr v-for="row in filteredRows" :key="row.id + '-' + (row.syncedAt || '')">
                  <td v-for="head in tableHeads" :key="head">{{ formatCell(row, head) }}</td>
                  <td>
                    <button v-if="activeMenu !== 'snapshot'" class="link" @click="editRow(row)">编辑</button>
                    <button v-if="activeMenu !== 'snapshot'" class="link danger" @click="deleteRow(row)">删除</button>
                    <button v-if="activeMenu === 'snapshot'" class="link" @click="viewSnapshot(row)">详情</button>
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
              <p>{{ selectedUser ? selectedUser.nickname : (selectedSnapshot ? '同步快照详情' : '接口预览 / 用户详情') }}</p>
            </div>
            <button class="btn btn--ghost" @click="refreshData">重载</button>
          </div>

          <template v-if="selectedSnapshot">
            <div class="profile-card">
              <div class="avatar">S</div>
              <div>
                <h4>用户 {{ selectedSnapshot.userId }}</h4>
                <p>同步时间：{{ formatTime(selectedSnapshot.syncedAt) }}</p>
              </div>
            </div>
            <pre class="json snapshot-json">{{ selectedSnapshot.snapshot }}</pre>
            <button class="btn btn--ghost full-btn" @click="selectedSnapshot = null">关闭详情</button>
          </template>

          <template v-else-if="selectedUser">
            <div class="profile-card">
              <div class="avatar">{{ selectedUser.nickname ? selectedUser.nickname.slice(0,1) : 'U' }}</div>
              <div>
                <h4>{{ selectedUser.nickname }}</h4>
                <p>ID: {{ selectedUser.id }}</p>
              </div>
            </div>
            <div class="sub-card" v-for="block in userBlocks" :key="block.key">
              <div class="sub-card__head"><h4>{{ block.title }}</h4><button class="btn btn--small" @click="clearSelectedUser(block.key)">清空</button></div>
              <div class="list">
                <div class="list__row" v-for="item in block.rows" :key="item.id">
                  <span>{{ item.label }}</span>
                  <button class="link danger" @click="deleteUserItem(block.key, item)">删除</button>
                </div>
                <p v-if="!block.rows.length" class="empty">暂无数据</p>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="preview-status">{{ backendStatus }}</div>
            <pre class="json">{{ backendPreview }}</pre>
          </template>
        </aside>
      </section>

      <div v-if="showForm" class="modal-mask" @click.self="closeForm">
        <div class="modal">
          <h3>{{ formTitle }}</h3>
          <div class="form-grid">
            <label v-for="field in formFields" :key="field.key">
              <span>{{ field.label }}</span>
              <input v-model.trim="formData[field.key]" :placeholder="field.placeholder || ''">
            </label>
          </div>
          <div class="modal-actions">
            <button class="btn btn--ghost" @click="closeForm">取消</button>
            <button class="btn" @click="submitForm">保存</button>
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
      activeMenu: 'dashboard',
      keyword: '', backendStatus: '未请求', backendPreview: '点击刷新数据后查看后端返回。',
      categories: [], words: [], users: [], studyRecords: [], favorites: [], errors: [], savedWords: [], snapshots: [],
      selectedUser: null, selectedFavorites: [], selectedErrors: [], selectedStudyRecords: [], selectedSavedWords: [], selectedSnapshot: null,
      showForm: false, formMode: 'create', formType: 'category', editingRow: null, formData: {},
      menus: [
        { key: 'dashboard', label: '仪表盘', icon: '🏠' },
        { key: 'category', label: '分类管理', icon: '📂' },
        { key: 'word', label: '单词管理', icon: '📘' },
        { key: 'user', label: '用户管理', icon: '👥' },
        { key: 'study', label: '学习记录', icon: '📈' },
        { key: 'favorite', label: '收藏记录', icon: '⭐' },
        { key: 'error', label: '错题记录', icon: '📝' },
        { key: 'saved', label: '生词本', icon: '🧠' },
        { key: 'snapshot', label: '同步快照', icon: '☁️' },
      ],
      titleMap: { dashboard: '仪表盘', category: '分类管理', word: '单词管理', user: '用户管理', study: '学习记录', favorite: '收藏记录', error: '错题记录', saved: '生词本', snapshot: '同步快照' },
      descMap: { dashboard: '系统概览与快捷操作', category: '维护词库分类', word: '维护单词数据', user: '查看和管理用户资产', study: '查看学习统计', favorite: '查看收藏数据', error: '查看错题数据', saved: '查看生词本数据', snapshot: '查看小程序同步快照' },
      dashboardCards: [
        { title: '用户资产管理', desc: '收藏、错题、学习记录、生词本都可查看和清理。' },
        { title: '词典与单词', desc: '支持分类、词典、单词增删改。' },
        { title: '统计预览', desc: '实时查看用户数量、单词数量和记录数量。' },
        { title: '同步快照', desc: '对小程序本地资产做同步查看。' },
      ],
    }
  },
  computed: {
    stats() { return [{ label: '分类', value: this.categories.length }, { label: '单词', value: this.words.length }, { label: '用户', value: this.users.length }, { label: '快照', value: this.snapshots.length }] },
    tableHeads() { const map = { category: ['id', 'name', 'sort'], word: ['id', 'word', 'meaning', 'phonetic', 'categoryId', 'recommended'], study: ['id', 'userId', 'categoryName', 'totalWords', 'accuracy'], favorite: ['id', 'userId', 'wordId'], error: ['id', 'userId', 'word', 'wrongCount'], saved: ['id', 'userId', 'word', 'example'], snapshot: ['userId', 'syncedAt'] }; return map[this.activeMenu] || [] },
    filteredRows() { const sourceMap = { category: this.categories, word: this.words, study: this.studyRecords, favorite: this.favorites, error: this.errors, saved: this.savedWords, snapshot: this.snapshots }; const rows = sourceMap[this.activeMenu] || []; if (!this.keyword) return rows; return rows.filter(item => JSON.stringify(item).toLowerCase().includes(this.keyword.toLowerCase())) },
    filteredUsers() { if (!this.keyword) return this.users; return this.users.filter(item => JSON.stringify(item).toLowerCase().includes(this.keyword.toLowerCase())) },
    searchPlaceholder() { const map = { category: '搜索分类', word: '搜索单词', study: '搜索学习记录', favorite: '搜索收藏记录', error: '搜索错题记录', saved: '搜索生词本', snapshot: '搜索快照' }; return map[this.activeMenu] || '搜索' },
    formTitle() { const action = this.formMode === 'create' ? '新增' : '编辑'; const map = { category: `${action}分类`, word: `${action}单词` }; return map[this.formType] || '表单' },
    formFields() { if (this.formType === 'category') return [{ key: 'name', label: '分类名称', placeholder: '例如：CET4' }, { key: 'sort', label: '排序', placeholder: '例如：1' }]; return [{ key: 'word', label: '英文单词', placeholder: '例如：apple' }, { key: 'meaning', label: '中文释义', placeholder: '例如：苹果' }, { key: 'phonetic', label: '音标', placeholder: '例如：[ˈæpl]' }, { key: 'example', label: '例句', placeholder: '例如：an apple a day' }, { key: 'categoryId', label: '分类ID', placeholder: '例如：1' }, { key: 'recommended', label: '推荐(0/1)', placeholder: '例如：1' }] },
    userBlocks() { return [{ key: 'favorites', title: '收藏', rows: this.selectedFavorites.map(item => ({ id: item.id, label: item.word })) }, { key: 'errors', title: '错题', rows: this.selectedErrors.map(item => ({ id: item.id, label: `${item.word}（错${item.wrongCount}次）` })) }, { key: 'study', title: '学习记录', rows: this.selectedStudyRecords.map(item => ({ id: item.id, label: `${item.categoryName} / ${item.accuracy}%` })) }, { key: 'saved', title: '生词本', rows: this.selectedSavedWords.map(item => ({ id: item.id, label: item.word })) }] },
  },
  methods: {
    async refreshData() {
      try {
        const [categories, words, users, studyRecords, favorites, errors, savedWords, snapshots] = await Promise.all([request('/categories'), request('/words'), request('/users'), request('/study-records'), request('/favorites'), request('/errors'), request('/saved-words'), request('/sync/snapshot/latest')])
        this.categories = categories.data || []
        this.words = words.data || []
        this.users = users.data || []
        this.studyRecords = studyRecords.data || []
        this.favorites = favorites.data || []
        this.errors = errors.data || []
        this.savedWords = savedWords.data || []
        this.snapshots = snapshots.data || []
        this.backendStatus = '接口正常'
        this.backendPreview = JSON.stringify({ categories, words, users, studyRecords, favorites, errors, savedWords, snapshots }, null, 2)
      } catch (error) { this.backendStatus = '接口异常'; this.backendPreview = String(error) }
    },
    formatCell(row, key) { if (key === 'syncedAt') return this.formatTime(row.syncedAt); return row[key] },
    formatTime(value) { if (!value) return '-'; const date = new Date(Number(value)); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}` },
    logout() { this.activeMenu = 'dashboard'; this.selectedUser = null; this.selectedSnapshot = null },
    openCategoryForm(row = null) { this.formType = 'category'; this.formMode = row ? 'edit' : 'create'; this.editingRow = row; this.formData = row ? { ...row } : { name: '', sort: 0 }; this.showForm = true },
    openWordForm(row = null) { this.formType = 'word'; this.formMode = row ? 'edit' : 'create'; this.editingRow = row; this.formData = row ? { ...row } : { word: '', meaning: '', phonetic: '', example: '', categoryId: 1, recommended: 0 }; this.showForm = true },
    closeForm() { this.showForm = false; this.editingRow = null },
    viewUser(row) { this.selectedUser = row; this.selectedSnapshot = null; this.loadUserDetail(row.id); this.activeMenu = 'user' },
    async loadUserDetail(userId) { const [favorites, errors, studyRecords, savedWords] = await Promise.all([request(`/users/${userId}/favorites`), request(`/users/${userId}/errors`), request(`/users/${userId}/study-records`), request(`/users/${userId}/saved-words`)]); this.selectedFavorites = favorites.data || []; this.selectedErrors = errors.data || []; this.selectedStudyRecords = studyRecords.data || []; this.selectedSavedWords = savedWords.data || [] },
    viewSnapshot(row) { this.selectedSnapshot = row; this.selectedUser = null },
    async deleteUser(row) { if (!confirm(`确定删除用户 ${row.nickname} 吗？`)) return; await request(`/users/${row.id}`, { method: 'DELETE' }); await this.refreshData(); if (this.selectedUser && this.selectedUser.id === row.id) this.selectedUser = null },
    async clearSelectedUser(type) { if (!this.selectedUser) return; const labels = { favorites: '收藏', errors: '错题', study: '学习记录', saved: '生词本' }; if (!confirm(`确定清空该用户的${labels[type]}吗？`)) return; await request(`/users/${this.selectedUser.id}/clear-${type}`, { method: 'POST' }); await this.loadUserDetail(this.selectedUser.id); await this.refreshData() },
    async deleteUserItem(type, item) { if (!confirm(`确定删除这条${type === 'favorites' ? '收藏' : type === 'errors' ? '错题' : type === 'study' ? '学习记录' : '生词'}吗？`)) return; const routes = { favorites: `/favorites/${item.id}`, errors: `/errors/${item.id}`, study: `/study-records/${item.id}`, saved: `/saved-words/${item.id}` }; await request(routes[type], { method: 'DELETE' }); await this.loadUserDetail(this.selectedUser.id); await this.refreshData() },
    editRow(row) { if (this.activeMenu === 'category') return this.openCategoryForm(row); if (this.activeMenu === 'word') return this.openWordForm(row) },
    async deleteRow(row) { if (!confirm('确定删除这条数据吗？')) return; const routes = { category: '/categories', word: '/words', study: `/study-records/${row.id}`, favorite: `/favorites/${row.id}`, error: `/errors/${row.id}`, saved: `/saved-words/${row.id}` }; const methods = { category: 'DELETE', word: 'DELETE', study: 'DELETE', favorite: 'DELETE', error: 'DELETE', saved: 'DELETE' }; const route = routes[this.activeMenu]; if (!route) return; await request(route, { method: methods[this.activeMenu], body: JSON.stringify({ id: row.id }) }); await this.refreshData() },
    async submitForm() { try { if (this.formType === 'category') { const payload = { id: this.formData.id || 0, name: this.formData.name, sort: Number(this.formData.sort || 0) }; if (this.formMode === 'create') await request('/categories', { method: 'POST', body: JSON.stringify(payload) }); else await request('/categories', { method: 'PUT', body: JSON.stringify(payload) }) } if (this.formType === 'word') { const payload = { id: this.formData.id || 0, categoryId: Number(this.formData.categoryId || 0), word: this.formData.word, meaning: this.formData.meaning, phonetic: this.formData.phonetic, example: this.formData.example, recommended: Number(this.formData.recommended || 0) }; if (this.formMode === 'create') await request('/words', { method: 'POST', body: JSON.stringify(payload) }); else await request('/words', { method: 'PUT', body: JSON.stringify(payload) }) } this.closeForm(); await this.refreshData() } catch (error) { alert(`保存失败：${error.message || error}`) } },
  },
  mounted() { this.refreshData() },
}
</script>

<style>
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Microsoft YaHei', Arial, sans-serif; background: #f4f7fb; color: #1f2937; }
button, input { font: inherit; }
.admin-shell { min-height: 100vh; display: grid; grid-template-columns: 280px 1fr; }
.sidebar { background: linear-gradient(180deg, #111827 0%, #1e293b 100%); color: #fff; padding: 24px 16px; }
.brand { display: flex; gap: 12px; align-items: center; margin-bottom: 24px; }
.brand__logo { width: 48px; height: 48px; border-radius: 16px; background: #4f46e5; display: grid; place-items: center; font-weight: 800; }
.menu { display: grid; gap: 10px; }
.menu__item { display: flex; gap: 10px; align-items: center; border: 0; width: 100%; padding: 14px 16px; border-radius: 14px; background: transparent; color: #cbd5e1; text-align: left; cursor: pointer; }
.menu__item.active, .menu__item:hover { background: rgba(79, 70, 229, 0.2); color: #fff; }
.main { padding: 24px; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.eyebrow { color: #64748b; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
.topbar h2 { margin: 6px 0 4px; font-size: 30px; }
.topbar p { margin: 0; color: #64748b; }
.topbar__actions { display: flex; gap: 10px; }
.btn { border: 0; border-radius: 12px; padding: 10px 14px; background: #4f46e5; color: #fff; cursor: pointer; }
.btn--ghost { background: #fff; color: #334155; border: 1px solid #dbe3f0; }
.btn--danger { background: #ef4444; }
.btn--small { padding: 6px 10px; font-size: 12px; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
.stat-card { background: #fff; border-radius: 18px; padding: 18px; box-shadow: 0 8px 28px rgba(15,23,42,.06); }
.stat-card__value { font-size: 30px; font-weight: 800; color: #4f46e5; }
.stat-card__label { margin-top: 6px; color: #64748b; }
.content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 18px; }
.panel { background: #fff; border-radius: 20px; padding: 18px; box-shadow: 0 8px 28px rgba(15,23,42,.06); }
.panel__head { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 16px; }
.panel__head h3 { margin: 0; font-size: 20px; }
.panel__head p { margin: 4px 0 0; color: #64748b; }
.search-row { display: flex; gap: 10px; margin-bottom: 14px; }
.search-row input, .form-grid input { width: 100%; border: 1px solid #dbe3f0; border-radius: 12px; padding: 12px 14px; outline: none; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; }
.link { border: 0; background: transparent; color: #4f46e5; cursor: pointer; margin-right: 10px; }
.link.danger { color: #dc2626; }
.dashboard { display: grid; gap: 16px; }
.hero-card { background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%); color: #fff; border-radius: 20px; padding: 22px; }
.hero-card h3 { margin: 0 0 8px; font-size: 26px; }
.hero-card p { margin: 0; line-height: 1.7; opacity: .95; }
.hero-actions { display: flex; gap: 10px; margin-top: 16px; }
.quick-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.quick-card { background: #f8fafc; border-radius: 16px; padding: 16px; }
.quick-card h4 { margin: 0 0 8px; }
.quick-card p { margin: 0; color: #64748b; line-height: 1.6; }
.profile-card { display: flex; gap: 12px; align-items: center; padding: 14px; border-radius: 16px; background: #f8fafc; margin-bottom: 14px; }
.avatar { width: 52px; height: 52px; border-radius: 50%; background: #4f46e5; color: #fff; display: grid; place-items: center; font-weight: 800; }
.sub-card { background: #f8fafc; border-radius: 16px; padding: 14px; margin-bottom: 12px; }
.sub-card__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.sub-card__head h4 { margin: 0; }
.list { display: grid; gap: 8px; }
.list__row { display: flex; justify-content: space-between; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
.list__row:last-child { border-bottom: 0; }
.empty { color: #64748b; margin: 0; }
.preview-status { margin-bottom: 10px; color: #64748b; }
.json { margin: 0; padding: 14px; background: #0f172a; color: #cbd5e1; border-radius: 16px; max-height: 520px; overflow: auto; white-space: pre-wrap; word-break: break-all; }
.snapshot-json { max-height: 420px; }
.full-btn { width: 100%; margin-top: 10px; }
.modal-mask { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: grid; place-items: center; padding: 20px; }
.modal { width: min(640px, 100%); background: #fff; border-radius: 20px; padding: 22px; }
.form-grid { display: grid; gap: 12px; margin-top: 14px; }
.form-grid label { display: grid; gap: 8px; color: #475569; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
@media (max-width: 1100px) { .admin-shell { grid-template-columns: 1fr; } .sidebar { display: none; } .content-grid { grid-template-columns: 1fr; } .stats, .quick-grid { grid-template-columns: 1fr; } .topbar { flex-direction: column; align-items: stretch; } }
</style>
