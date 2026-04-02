# Unit Release 彻底解决方案

## 问题分析

### 原有痛点

1. **选择负担重**：需要手动选择 3 个关系字段（Unit、Story Version、InsightSet Version）
2. **易出错**：容易选错版本，导致验证失败
3. **流程繁琐**：需要理解数据之间的复杂关系
4. **用户体验差**：对于 1 theme = 1 story = 1 set of cards 的场景过于复杂

### 数据现状

- ✅ Theme、Story、InsightSet、Cards 已通过接口完整写入
- ✅ Theme 与 Story、InsightSet 通过 theme_id 关联（1:1:1 关系）
- ✅ Unit (insight-story-unit) 数据已存在
- ❌ 无需修改接口写入逻辑
- ❌ 无需修改数据库结构

## 解决方案

### 核心理念

**"只选 Theme，其余自动"**

用户只需要选择一个 Theme，系统自动：

1. 查找 Theme 关联的 Story 和 InsightSet
2. 查找或自动创建对应的 Unit
3. 查找最新的 Story Version 和 InsightSet Version
4. 自动填充表单所有必要字段
5. 用户只需配置发布时间窗口

### 技术实现

#### 1. 自定义创建组件 (`UnitReleaseAutoCreator.tsx`)

**位置**：`app/(payload)/admin/components/UnitReleaseAutoCreator.tsx`

**功能**：

- 显示 Theme 下拉选择器（从现有 Themes 加载）
- 选择 Theme 后，实时生成预览
- 预览显示所有关联关系的查找结果
- 点击 "Auto-Fill Form" 自动填充所有字段

**界面布局**：

```
┌─────────────────────────────────────┐
│  Quick Unit Release Creator         │
├─────────────────────────────────────┤
│  Theme: [▼ Select a Theme]          │
│                                     │
│  Preview:                           │
│  ┌─────────────────────────────────┐│
│  │ Theme:   Understanding Anxiety ││
│  │ Story:    The Taste of Clarity ││
│  │ InsightSet: Anxiety & Appetite ││
│  │ Unit:      ✅ Auto-linked      ││
│  │ StoryVer:  ✅ v1               ││
│  │ InsightVer:✅ v1               ││
│  └─────────────────────────────────┘│
│                                     │
│                    [Auto-Fill Form]│
└─────────────────────────────────────┘
```

#### 2. Unit Release 配置优化 (`unitReleases.ts`)

**修改点**：

- 添加 `components.edit.BeforeInput` 指向自定义组件
- 简化字段配置，移除复杂的 `filterOptions`
- 添加隐藏的 `themeId` 字段（用于组件与 hook 间传递数据）
- 字段保持可编辑，支持手动调整

**字段配置**：

- `themeId`: 隐藏字段，存储选择的 Theme ID
- `unit`: 关系字段，自动填充
- `storyVersion`: 关系字段，自动填充
- `insightSetVersion`: 关系字段，自动填充
- 其他字段：保持不变（status, startAt, endAt, priority 等）

#### 3. 自动创建 Unit Hook (`autoCreateUnitIfNeeded.ts`)

**位置**：`test/_community/qmm/hooks/autoCreateUnitIfNeeded.ts`

**功能**：

- 在保存前检查 unit 字段是否为空
- 如果为空，尝试使用 themeId 自动创建 Unit
- 查找 Theme 关联的 Story 和 InsightSet
- 检查 Unit 是否已存在
- 如不存在，自动创建新的 Unit
- 将 unit ID 填充到数据中

**安全机制**：

- 如果找不到 Story 或 InsightSet，抛出明确错误
- 如果 Unit 已存在，直接使用
- 只在创建和更新操作时运行

### 使用流程

#### 创建 Unit Release（新流程）

1. **访问创建页面**

   ```
   /admin/collections/unit-releases/create
   ```

2. **使用 Quick Creator**

   - 在表单顶部看到 "Quick Unit Release Creator" 区域
   - 从下拉菜单选择一个 Theme
   - 系统立即加载预览，显示所有关联关系

3. **预览验证**

   - 检查所有关联是否正确显示
   - 绿色 ✅ 表示找到对应记录
   - 红色 ❌ 表示缺失必要数据
   - 橙色 ⚠️ 表示将自动创建

4. **Auto-Fill Form**

   - 点击 "Auto-Fill Form" 按钮
   - 系统自动填充：unit, storyVersion, insightSetVersion
   - 设置默认值：status='scheduled', channel='web', priority=0
   - 滚动到标准表单区域

5. **配置发布参数**

   - 修改 Status（Scheduled/Active/Paused）
   - 设置 Start At 时间
   - 设置 End At 时间（可选）
   - 调整 Priority（优先级）
   - 配置 Traffic Weight（流量权重）

6. **保存**
   - 点击 Save
   - Hook 自动验证数据一致性
   - 确保同一 Unit + Channel 只有一个 Active
   - 创建成功，跳转到列表页

#### 数据完整性验证

**如果缺少数据，系统会明确提示**：

```
❌ Cannot auto-fill: Missing required relationships
   - Story: Not found for theme 123
   - InsightSet: Not found for theme 123

解决：请确保该 Theme 已关联 Story 和 InsightSet
```

**如果 Unit 不存在，自动创建**：

```
✅ Unit "Story Title + InsightSet Name" created automatically
```

### 技术优势

#### 1. **零数据迁移**

- ✅ 不修改数据库结构
- ✅ 不修改接口写入逻辑
- ✅ 只添加辅助字段（themeId，隐藏）

#### 2. **完全兼容现有数据**

- ✅ 已有 Unit 数据正常使用
- ✅ 已有 Version 数据自动识别
- ✅ 支持手动调整填充结果

#### 3. **极致简化**

- ✅ 从 3 个选择器 → 1 个选择器
- ✅ 从多次选择 → 一次点击
- ✅ 从易出错 → 自动验证

#### 4. **可回退**

- ✅ 字段保持可编辑
- ✅ 支持手动创建模式
- ✅ 不破坏原有功能

#### 5. **智能提示**

- ✅ 实时预览所有关联
- ✅ 明确的错误信息
- ✅ 一键自动填充

### 代码结构

```
test/_community/qmm/collections/unitReleases.ts          # 主配置
test/_community/qmm/hooks/autoCreateUnitIfNeeded.ts     # 自动创建 Unit Hook
test/_community/qmm/hooks/index.ts                      # Hook 导出
app/(payload)/admin/components/UnitReleaseAutoCreator.tsx  # 自定义 React 组件
```

### 配置摘要

#### 修改的文件

1. `test/_community/qmm/collections/unitReleases.ts`

   - 添加 `components.edit.BeforeInput`
   - 简化字段配置
   - 添加 `themeId` 字段
   - 添加 `autoCreateUnitIfNeeded` hook

2. `test/_community/qmm/hooks/index.ts`

   - 导出 `autoCreateUnitIfNeeded`

3. `test/_community/qmm/hooks/autoCreateUnitIfNeeded.ts` (新建)

   - 自动创建缺失的 Unit

4. `app/(payload)/admin/components/UnitReleaseAutoCreator.tsx` (新建)
   - 自定义创建界面

#### 未修改的文件

- ✅ 所有接口写入逻辑
- ✅ 数据库结构
- ✅ Theme/Story/InsightSet 配置
- ✅ 其他 Collection 配置

### 启动说明

```bash
# 启动服务
PAYLOAD_DATABASE=sqlite SQLITE_URL=file:./payload-qmm.db PAYLOAD_DROP_DATABASE=false pnpm dev _community

# 访问创建页面
open http://127.0.0.1:3000/admin/collections/unit-releases/create
```

### 验证步骤

1. **检查 Theme 数据**

   ```bash
   sqlite3 payload-qmm.db "SELECT id, name FROM themes LIMIT 5;"
   ```

2. **检查关联完整性**

   ```bash
   sqlite3 payload-qmm.db "SELECT t.id, t.name, s.id, s.title, i.id, i.name
   FROM themes t
   JOIN stories s ON t.id = s.theme_id
   JOIN insight_sets i ON t.id = i.theme_id
   LIMIT 5;"
   ```

3. **测试创建流程**
   - 选择一个 Theme
   - 验证预览显示所有 ✅
   - 点击 Auto-Fill Form
   - 配置发布时间
   - 保存
   - 检查创建结果

### 总结

这个方案提供了**最简化的创建流程**，同时：

- **不修改**任何接口写入逻辑
- **不修改**数据库结构
- **不改变**现有数据关系
- **只优化** Unit Release 创建界面

用户从原来的 **3 个选择器 + 多次筛选** 简化为 **1 个选择器 + 一键填充**，大幅降低操作难度和错误率。
