<template>
  <div id="app-wrapper">
    <!-- 第一层：系统标题栏（底图 + 叠加系统名称 + 按钮组） -->
    <header class="sys-header">
      <img :src="baseUrl + 'header.svg'" alt="" class="header-title-img" />
      <div class="header-left">
        <span class="header-sys-title">零碳园区智慧能碳服务平台</span>
      </div>
      <div class="header-btn-group">
        <div v-for="b in headerBtns" :key="b.key" class="header-btn-item" @click="onHeaderBtn(b)">
          <img :src="baseUrl + (activeMenu === b.key ? '选中.svg' : '未选中.svg')" alt="" class="header-btn-bg" />
          <span class="header-btn-label">{{ b.label }}</span>
        </div>
      </div>
    </header>

    <!-- 主体区域：左侧菜单栏 + 右侧内容区 -->
    <div class="main-body">
      <!-- 左侧主菜单栏 -->
      <aside class="main-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <!-- 顶部收缩按钮 -->
        <div class="sidebar-toggle-btn" @click="toggleSidebar">
          <span class="toggle-label">{{ sidebarCollapsed ? '展开' : '收起' }}</span>
          <span class="toggle-arrow">{{ sidebarCollapsed ? '&gt;&gt;' : '&lt;&lt;' }}</span>
        </div>

        <!-- 顶部一级标识图 -->
        <div class="sidebar-top-banner" v-show="!sidebarCollapsed">
          <img :src="baseUrl + '一级.svg'" alt="" class="sidebar-banner-img" />
        </div>

        <!-- 菜单列表 -->
        <nav class="sidebar-nav-list">
          <template v-for="item in menuItems">
            <!-- 一级菜单（无子菜单） -->
            <div
              v-if="!item.children"
              :key="item.key"
              class="sidebar-nav-item"
              :class="{ active: activeMenu === item.key }"
              @click="onMenuClick(item)"
              :title="sidebarCollapsed ? item.label : ''"
            >
              <i :class="item.icon" class="nav-item-icon"></i>
              <span class="nav-item-text" v-show="!sidebarCollapsed">{{ item.label }}</span>
            </div>
            <!-- 一级菜单（有子菜单） -->
            <div v-else :key="item.key" class="sidebar-nav-group">
              <div
                class="sidebar-nav-item sidebar-nav-parent"
                :class="{ active: expandedMenus.includes(item.key) }"
                @click="toggleSubMenu(item.key)"
                :title="sidebarCollapsed ? item.label : ''"
              >
                <i :class="item.icon" class="nav-item-icon"></i>
                <span class="nav-item-text" v-show="!sidebarCollapsed">{{ item.label }}</span>
                <i v-show="!sidebarCollapsed" class="nav-item-arrow el-icon-arrow-down" :class="{ expanded: expandedMenus.includes(item.key) }"></i>
              </div>
              <!-- 二级菜单 -->
              <div v-show="expandedMenus.includes(item.key) && !sidebarCollapsed" class="sidebar-sub-menu">
                <div
                  v-for="child in item.children"
                  :key="child.key"
                  class="sidebar-nav-item sidebar-nav-child"
                  :class="{ active: activeMenu === child.key }"
                  @click="onMenuClick(child)"
                >
                  <i :class="child.icon" class="nav-item-icon"></i>
                  <span class="nav-item-text">{{ child.label }}</span>
                </div>
              </div>
            </div>
          </template>
        </nav>
      </aside>

      <!-- 右侧区域 -->
      <div class="right-container">
        <!-- 第二层：多标签页导航栏 -->
        <div class="tab-bar">
          <div class="tab-list">
            <div
              v-for="(tab, index) in openedTabs"
              :key="tab.path"
              class="tab-item"
              :class="{ active: isActiveTab(tab.path) }"
              @click="switchTab(tab)"
            >
              <span class="tab-text">{{ tab.title }}</span>
              <span
                class="tab-close"
                @click.stop="closeTab(index)"
              ><svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>
            </div>
          </div>
        </div>

        <!-- 第三层：内容显示区 -->
        <main class="content-area">
          <router-view v-if="isRouterAlive" />
        </main>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  provide() { return { reload: this.reload } },
  data() {
    return {
      isRouterAlive: true,
      sidebarCollapsed: false,
      activeMenu: 'agent-center',
      expandedMenus: [],
      baseUrl: (process.env.NODE_ENV === 'production' ? './' : '/') + 'images/',
      headerBtns: [
        { key: 'agent-center', label: '首页' },
        { key: 'resource-ledger', label: '资源台账' },
        { key: 'system-admin', label: '运维管理' }
      ],
      menuItems: [
        { key: 'agent-center', label: '首页', icon: 'el-icon-s-home', route: '/agent-center/apps', pageTitle: '首页' },
        {
          key: 'carbon-accounting',
          label: '智能场景',
          icon: 'el-icon-cpu',
          children: [
            { key: 'product-footprint', label: '产品碳足迹', icon: 'el-icon-s-marketing', route: '/agent-center/apps/carbon-accounting', pageTitle: '产品碳足迹' },
            { key: 'pef-footprint', label: '产品环境足迹', icon: 'el-icon-data-analysis', route: '/agent-center/apps/pef-accounting', pageTitle: '产品环境足迹' },
            { key: 'org-carbon', label: '组织碳核算', icon: 'el-icon-office-building', route: '/agent-center/apps/org-accounting', pageTitle: '组织碳核算' },
            { key: 'beijing-carbon', label: '北京碳市场', icon: 'el-icon-s-flag', route: '/beijing-carbon/accounting/agent', pageTitle: '北京碳市场' },
            { key: 'zero-carbon-park', label: '园区碳核算', icon: 'el-icon-school', route: '/park-accounting/workspace', pageTitle: '园区碳核算' },
            { key: 'zero-carbon-factory', label: '零碳工厂', icon: 'el-icon-sunny', route: '/agent-center/apps/zero-carbon-factory', pageTitle: '零碳工厂' },
            { key: 'green-factory', label: '绿色工厂', icon: 'el-icon-grape', route: '/green-factory/agent', pageTitle: '绿色工厂' },
            { key: 'report-submission', label: '智慧报告', icon: 'el-icon-document-checked', route: '/agent-center/apps/report-submission', pageTitle: '智慧报告' }
          ]
        },
        {
          key: 'resource-ledger',
          label: '资源台账',
          icon: 'el-icon-folder-opened',
          children: [
            { key: 'carbon-footprint-report', label: '报告与档案中心', icon: 'el-icon-document-checked', route: '/agent-center/apps/carbon-footprint-report', pageTitle: '报告与档案中心' },
            { key: 'accounting-template-library', label: '组织模板库', icon: 'el-icon-document-copy', route: '/agent-center/apps/accounting-template-library', pageTitle: '组织模板库' },
            { key: 'declaration-material-library', label: '佐证材料库', icon: 'el-icon-folder-opened', route: '/agent-center/apps/declaration-material-library', pageTitle: '佐证材料库' },
            { key: 'enterprise-factor-library', label: '企业因子库', icon: 'el-icon-odometer', route: '/agent-center/apps/enterprise-factor-library', pageTitle: '企业因子库' },
            { key: 'organization-resource-library', label: '组织资源库', icon: 'el-icon-office-building', route: '/agent-center/apps/organization-resource-library', pageTitle: '组织资源库' },
            { key: 'enterprise-product-library', label: '企业产品库', icon: 'el-icon-goods', route: '/agent-center/apps/enterprise-product-library', pageTitle: '企业产品库' },
            { key: 'product-sop-library', label: '产品SOP库', icon: 'el-icon-reading', route: '/agent-center/apps/product-sop-library', pageTitle: '产品SOP库' }
          ]
        },
        {
          key: 'system-admin',
          label: '运维管理',
          icon: 'el-icon-s-tools',
          children: [
            { key: 'standards-library', label: '政策标准库', icon: 'el-icon-collection', route: '/agent-center/apps/standards-library', pageTitle: '政策标准库' },
            { key: 'emission-factor-library', label: '排放因子库', icon: 'el-icon-coin', route: '/agent-center/apps/emission-factor-library', pageTitle: '排放因子库' },
            { key: 'platform-template-library', label: '平台模板库', icon: 'el-icon-files', route: '/agent-center/apps/platform-template-library', pageTitle: '平台模板库' },
            { key: 'formula-library', label: '核算公式库', icon: 'el-icon-s-operation', route: '/agent-center/apps/formula-library', pageTitle: '核算公式库' },
            { key: 'process-library', label: '单元过程库', icon: 'el-icon-cpu', route: '/agent-center/apps/process-library', pageTitle: '单元过程库' },
            { key: 'skill-management', label: 'Skill管理', icon: 'el-icon-magic-stick', route: '/agent-center/apps/skill-management', pageTitle: 'Skill管理' }
          ]
        }
      ],
      openedTabs: [
        { path: '/agent-center/apps', title: '首页', fixed: true }
      ]
    }
  },
  watch: {
    '$route': {
      handler(to) {
        // 根据路由自动匹配左侧菜单
        if (to.path === '/agent-center/apps' || to.path === '/') {
          this.activeMenu = 'agent-center';
        } else if (to.path.includes('org-accounting')) {
          this.activeMenu = 'org-carbon';
        } else if (to.path.includes('beijing-carbon')) {
          this.activeMenu = 'beijing-carbon';
        } else if (to.path.includes('pef-accounting') || to.path.includes('pef-accounting/accounting/agent')) {
        this.activeMenu = 'pef-footprint';
      } else if (to.path.includes('carbon-accounting') || to.path.includes('footprint/accounting/agent')) {
          this.activeMenu = 'product-footprint';
        } else if (to.path.includes('pef-accounting')) {
          this.activeMenu = 'pef-footprint';
        } else if (to.path.includes('zero-carbon-park') || to.path.includes('park-accounting')) {
          this.activeMenu = 'zero-carbon-park';
        } else if (to.path.includes('zero-carbon-factory')) {
          this.activeMenu = 'zero-carbon-factory';
        } else if (to.path.includes('green-factory')) {
          this.activeMenu = 'green-factory';
        } else if (to.path.includes('report-submission')) {
          this.activeMenu = 'report-submission';
        } else if (to.path.includes('carbon-footprint-report')) {
          this.activeMenu = 'carbon-footprint-report';
        } else if (to.path.includes('enterprise-product-library')) {
          this.activeMenu = 'enterprise-product-library';
        } else if (to.path.includes('product-sop-library')) {
          this.activeMenu = 'product-sop-library';
        } else if (to.path.includes('process-library')) {
          this.activeMenu = 'process-library';
        } else if (to.path.includes('organization-resource-library')) {
          this.activeMenu = 'organization-resource-library';
        } else if (to.path.includes('standards-library')) {
          this.activeMenu = 'standards-library';
        } else if (to.path.includes('emission-factor-library')) {
          this.activeMenu = 'emission-factor-library';
        } else if (to.path.includes('accounting-template-library')) {
          this.activeMenu = 'accounting-template-library';
        } else if (to.path.includes('platform-template-library')) {
          this.activeMenu = 'platform-template-library';
        } else if (to.path.includes('formula-library')) {
          this.activeMenu = 'formula-library';
        } else if (to.path.includes('declaration-material-library')) {
          this.activeMenu = 'declaration-material-library';
        }
        // 自动展开包含当前激活菜单的父菜单
        this.autoExpandParent();
        // 自动添加标签页
        this.addTab(to);
      },
      immediate: true
    }
  },
  methods: {
    reload() { this.isRouterAlive = false; this.$nextTick(() => { this.isRouterAlive = true }) },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    onMenuClick(item) {
      if (!item.route) return;
      this.activeMenu = item.key;
      if (this.$route.path !== item.route) {
        this.$router.push(item.route).catch(() => {});
      }
    },
    toggleSubMenu(key) {
      const idx = this.expandedMenus.indexOf(key);
      if (idx >= 0) {
        this.expandedMenus.splice(idx, 1);
      } else {
        this.expandedMenus.push(key);
      }
    },
    autoExpandParent() {
      this.menuItems.forEach(item => {
        if (item.children && item.children.some(c => c.key === this.activeMenu)) {
          if (!this.expandedMenus.includes(item.key)) {
            this.expandedMenus.push(item.key);
          }
        }
      });
    },
    findMenuItem(path) {
      for (const item of this.menuItems) {
        if (item.route === path) return item;
        if (item.children) {
          const child = item.children.find(c => c.route === path);
          if (child) return child;
        }
      }
      return null;
    },
    goHome() {
      this.activeMenu = 'agent-center';
      if (this.$route.path !== '/agent-center/apps') {
        this.$router.push('/agent-center/apps').catch(() => {});
      }
    },
    onHeaderBtn(btn) {
      this.activeMenu = btn.key;
      const routes = {
        'agent-center': '/agent-center/apps',
        'resource-ledger': '/agent-center/apps/carbon-footprint-report',
        'system-admin': '/agent-center/apps/platform-template-library'
      };
      if (this.$route.path !== routes[btn.key]) this.$router.push(routes[btn.key]);
    },
    addTab(route) {
      let path = route.path;
      // 首页重定向处理
      if (path === '/') return;
      // 九阶段工作台复用对应智能体中心的标签页（避免产生重复标签）
      if (path === '/footprint/accounting/agent') {
        path = '/agent-center/apps/carbon-accounting';
      }
      if (path === '/pef-accounting/accounting/agent') {
        path = '/agent-center/apps/pef-accounting';
      }
      // 组织碳核算九阶段工作台复用工作台页签
      if (path === '/org-accounting/accounting/agent') {
        path = '/agent-center/apps/org-accounting';
      }
      // 北京碳市场九阶段工作台复用工作台页签
      if (path === '/beijing-carbon/accounting/agent' || path === '/bj-carbon/accounting/agent') {
        path = '/agent-center/apps/beijing-carbon';
      }
      // 园区碳核算工作台/三步/九阶段共用同一页签
      if (path === '/park-carbon/accounting/agent' ||
          path === '/park-accounting/accounting/agent' ||
          path === '/park-accounting/accounting/stages9' ||
          path === '/park-accounting/workspace') {
        path = '/park-accounting/workspace';
      }
      // 检查是否已存在
      const exists = this.openedTabs.find(tab => tab.path === path);
      if (exists) return;
      // 获取标题：优先 meta.title，兜底 menuItems
      let title = '';
      if (route.meta && route.meta.title) {
        title = route.meta.title;
      } else {
        const menuItem = this.findMenuItem(path);
        title = menuItem ? menuItem.pageTitle : '未命名页面';
      }
      this.openedTabs.push({ path, title, fixed: false });
    },
    isActiveTab(path) {
      let currentPath = this.$route.path;
      // 九阶段工作台时，对应中心标签页也显示为激活状态
      if (currentPath === '/footprint/accounting/agent') {
        currentPath = '/agent-center/apps/carbon-accounting';
      }
      if (currentPath === '/pef-accounting/accounting/agent') {
        currentPath = '/agent-center/apps/pef-accounting';
      }
      if (currentPath === '/org-accounting/accounting/agent') {
        currentPath = '/agent-center/apps/org-accounting';
      }
      if (currentPath === '/beijing-carbon/accounting/agent' || currentPath === '/bj-carbon/accounting/agent') {
        currentPath = '/agent-center/apps/beijing-carbon';
      }
      if (currentPath === '/park-carbon/accounting/agent' ||
          currentPath === '/park-accounting/accounting/agent' ||
          currentPath === '/park-accounting/accounting/stages9') {
        currentPath = '/park-accounting/workspace';
      }
      return currentPath === path;
    },
    switchTab(tab) {
      if (this.$route.path !== tab.path) {
        this.$router.push(tab.path).catch(() => {});
      }
    },
    closeTab(index) {
      const tab = this.openedTabs[index];
      if (!tab) return;
      const isActive = this.isActiveTab(tab.path);
      this.openedTabs.splice(index, 1);
      // 关闭后没有页签 → 回首页
      if (this.openedTabs.length === 0) {
        this.$router.replace('/agent-center/apps').catch(() => {});
        return;
      }
      // 关闭的是当前激活页签 → 跳到相邻页签
      if (isActive) {
        const nextIndex = index < this.openedTabs.length ? index : index - 1;
        const nextTab = this.openedTabs[nextIndex];
        if (nextTab) {
          this.$router.replace(nextTab.path).catch(() => {});
        } else {
          this.$router.replace('/agent-center/apps').catch(() => {});
        }
        return;
      }
      // 兜底：若关闭的是 fixed 首页且当前路由已不在任何页签内 → 回首页
      const cur = this.$route.path;
      const stillExists = this.openedTabs.some(t => t.path === cur);
      if (!stillExists) {
        this.$router.replace('/agent-center/apps').catch(() => {});
      }
    }
  }
}
</script>

<style>
@font-face {
  font-family: 'AlibabaPuHuiTi';
  src: url('./assets/fonts/AlibabaPuHuiTi-3-115-Black.ttf') format('truetype');
  font-weight: 900;
  font-display: swap;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #303133; background: #e8f2ff; overflow: hidden; }

#app-wrapper { height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

/* 第一层：系统标题栏（底图 + 叠加系统名称 + 按钮组） */
.sys-header {
  flex-shrink: 0;
  width: 100%;
  height: 64px;
  background: linear-gradient(180deg, #0b151f 0%, #091e36 100%);
  z-index: 200;
  line-height: 0;
  position: relative;
  overflow: hidden;
}
.header-title-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}
/* 限定作用域：只作用于系统标题栏内部，避免污染子组件同名类（如 AgentAppLayout 的 header-left） */
.sys-header .header-left {
  position: absolute;
  left: 128px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  z-index: 201;
}
.header-sys-title {
  font-family: 'Source Han Sans SC', 'Noto Sans SC', '思源黑体', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: #ffffff;
  letter-spacing: 1px;
  line-height: 1;
  white-space: nowrap;
  text-shadow: 0 1px 8px rgba(0, 150, 255, 0.35);
}
.header-btn-group {
  position: absolute;
  right: 52.8125%;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 0.521vw;
  z-index: 201;
}
.header-btn-item {
  position: relative;
  width: 5.625vw;
  height: 1.563vw;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.header-btn-item:hover {
  transform: scale(1.03);
}
.header-btn-bg {
  width: 5.625vw;
  height: 1.563vw;
  display: block;
}
.header-btn-label {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.73vw;
  color: #fff;
  letter-spacing: 0.104vw;
}

/* 主体区域：左右布局 */
.main-body { flex: 1; display: flex; overflow: hidden; }

/* 左侧主菜单栏 — 与标题栏同色系无缝衔接 */
.main-sidebar {
  width: 200px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #1a3a5c 0%, #122d48 40%, #0c223b 100%);
  display: flex;
  flex-direction: column;
  overflow: visible;
  transition: width 0.3s ease;
  position: relative;
}

.main-sidebar.collapsed {
  width: 64px;
}

/* 顶部收缩按钮 — 模拟深蓝梯形+竖排文字，凸出于菜单栏右侧 */
.sidebar-toggle-btn {
  position: absolute;
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  min-height: 60px;
  padding: 8px 2px 8px 2px;
  background: linear-gradient(135deg, #1a3a5c 0%, #122d48 40%, #0c223b 100%);
  border: 1px solid rgba(80, 160, 220, 0.35);
  border-left: none;
  /* 左侧全高、右侧收窄的梯形，收窄幅度小不裁文字 */
  clip-path: polygon(0% 0%, 100% 8%, 100% 92%, 0% 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  z-index: 15;
  transition: opacity 0.15s ease;
  box-shadow: 2px 2px 10px rgba(0, 15, 40, 0.5);
}

.sidebar-toggle-btn:hover {
  opacity: 0.9;
}

.toggle-label {
  writing-mode: vertical-rl;
  text-orientation: upright;
  font-size: 9px;
  letter-spacing: 2px;
  color: rgba(150, 195, 235, 0.85);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  line-height: 1;
}

.toggle-arrow {
  font-size: 8px;
  color: rgba(120, 175, 220, 0.7);
  line-height: 1;
  margin-top: 2px;
}

.sidebar-top-banner {
  flex-shrink: 0;
  width: 100%;
  height: 40px;
  display: flex;
  align-items: flex-end;
  padding: 0 16px;
  line-height: 0;
  overflow: hidden;
}

.sidebar-banner-img {
  max-width: 100%;
  height: auto;
  display: block;
}

.sidebar-nav-list {
  flex: 1;
  padding: 0 0 8px 0;
  overflow-y: auto;
}

.main-sidebar.collapsed .sidebar-nav-list {
  padding: 8px 0;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  height: 46px;
  padding: 0 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border-left: 3px solid transparent;
}

.main-sidebar.collapsed .sidebar-nav-item {
  padding: 0;
  justify-content: center;
}

.sidebar-nav-item:hover {
  background: rgba(0, 162, 255, 0.08);
}

.sidebar-nav-item.active {
  background-image: url('~@/assets/menu-active.png');
  background-repeat: no-repeat;
  background-position: center center;
  background-size: 100% 100%;
  border-left: none;
  transition: none;
}

.sidebar-nav-item.active:hover {
  background: url('~@/assets/menu-active.png') no-repeat center center / 100% 100%;
}

.main-sidebar.collapsed .sidebar-nav-item.active {
  background-image: url('~@/assets/menu-active.png');
  background-repeat: no-repeat;
  background-position: center center;
  background-size: 100% 100%;
  border-left: none;
  transition: none;
}

.nav-item-icon {
  font-size: 16px;
  color: #6b8ca8;
  margin-right: 12px;
  transition: all 0.2s ease;
}

.main-sidebar.collapsed .nav-item-icon {
  margin-right: 0;
  font-size: 18px;
}

.sidebar-nav-item:hover .nav-item-icon {
  color: #8bbce0;
}

.sidebar-nav-item.active .nav-item-icon {
  color: #ffffff;
}

.nav-item-text {
  font-size: 14px;
  color: #8ba8bf;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  transition: all 0.2s ease;
}

.sidebar-nav-item:hover .nav-item-text {
  color: #b8d4e8;
}

.sidebar-nav-item.active .nav-item-text {
  color: #ffffff;
  font-weight: 500;
}

/* ===== 二级菜单样式 ===== */
.sidebar-nav-parent {
  justify-content: flex-start;
}
.sidebar-nav-parent .nav-item-text {
  flex: 1;
}
.nav-item-arrow {
  font-size: 12px;
  color: #8ba8bf;
  transition: transform 0.25s ease;
  margin-left: auto;
}
.nav-item-arrow.expanded {
  transform: rotate(180deg);
}
.sidebar-nav-parent.active {
  background-image: none;
  background: rgba(0, 162, 255, 0.06);
}
.sidebar-nav-parent.active .nav-item-icon,
.sidebar-nav-parent.active .nav-item-text,
.sidebar-nav-parent.active .nav-item-arrow {
  color: #5b9bd5;
}
.sidebar-sub-menu {
  overflow: hidden;
}
.sidebar-nav-child {
  height: 40px;
  padding-left: 48px !important;
}
.sidebar-nav-child .nav-item-icon {
  font-size: 14px;
  width: 16px;
}
.sidebar-nav-child .nav-item-text {
  font-size: 13px;
}

/* 右侧区域 */
.right-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #e8f2ff;
}

/* 第二层：多标签页导航栏 */
.tab-bar {
  flex-shrink: 0;
  height: 40px;
  display: flex;
  align-items: center;
  background: url('~@/assets/nav-bg.svg') no-repeat center center / cover, linear-gradient(180deg, #0b151f 0%, #091e36 100%);
  border-bottom: 1px solid #e4e7ed;
}

.tab-list {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  overflow-x: auto;
  overflow-y: hidden;
  height: 100%;
  flex: 1;
}

.tab-list::-webkit-scrollbar {
  height: 3px;
}

.tab-list::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 2px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  min-height: 32px;
  max-height: 32px;
  padding: 0 12px 0 28px;
  border-radius: 0;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  background-color: transparent;
  background-image: url('~@/assets/tab-inactive.svg');
  background-repeat: no-repeat;
  background-position: center center;
  background-size: 100% 100%;
  border: none;
}

.tab-item:hover {
  opacity: 0.85;
}

.tab-item.active {
  background-color: #0C283A;
  background-image: url('~@/assets/tab-active.svg');
  background-repeat: no-repeat;
  background-position: center center;
  background-size: 100% 100%;
  border: none;
  box-shadow: none;
}

.tab-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
  flex-shrink: 0;
}

.tab-text {
  font-size: 13px;
  color: #8ba8bf;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  transition: color 0.15s ease;
  margin-left: 4px;
}

.tab-item:hover .tab-text {
  color: #b8d4e8;
}

.tab-item.active .tab-text {
  color: #37DFDE;
  font-weight: 500;
  margin-left: 6px;
}

/* 关闭按钮 */
.tab-close {
  font-size: 14px;
  color: #8ba8bf;
  margin-left: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  cursor: pointer;
  position: relative;
  z-index: 10;
  transition: color 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}

.tab-item.active .tab-close {
  color: #37DFDE;
}

.tab-item.active .tab-close:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.22);
}

.tab-item .tab-close:hover {
  color: #b8d4e8;
  background: rgba(139, 168, 191, 0.15);
}

/* 第三层：内容显示区 */
.content-area { flex: 1; overflow: hidden; background: #e8f2ff; position: relative; margin: 0; padding: 16px 24px; }
</style>
