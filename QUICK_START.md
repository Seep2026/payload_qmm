# Unit Release 快速启动指南

## 🎯 解决方案核心

**只选 Theme，其余自动！**

从 3 个选择器 + 手动筛选 → 1 个选择器 + 一键自动填充

## 🚀 启动步骤

### 1. 启动服务

```bash
PAYLOAD_DATABASE=sqlite SQLITE_URL=file:./payload-qmm.db PAYLOAD_DROP_DATABASE=false pnpm dev _community
```

### 2. 访问创建页面

打开浏览器：

```
http://127.0.0.1:3000/admin/collections/unit-releases/create
```

### 3. 使用 Quick Creator

在表单顶部找到 "Quick Unit Release Creator" 区域：

1. **选择 Theme** - 从下拉菜单选择一个主题
2. **查看预览** - 系统自动显示所有关联关系
   - ✅ 绿色：找到对应记录
   - ❌ 红色：缺失必要数据
   - ⚠️ 橙色：将自动创建
3. **点击 Auto-Fill Form** - 一键填充所有字段
4. **配置发布时间** - 设置：
   - Status（状态）
   - Start At（开始时间）
   - End At（结束时间，可选）
   - Priority（优先级）
5. **保存** - 点击 Save 按钮

## ✅ 数据验证

确保数据完整性：

```bash
# 检查 Theme 数据
sqlite3 payload-qmm.db "SELECT id, name FROM themes;"

# 验证关联关系
sqlite3 payload-qmm.db "SELECT t.name, s.title, i.name FROM themes t JOIN stories s ON t.id = s.theme_id JOIN insight_sets i ON t.id = i.theme_id;"

# 检查 Unit 数据
sqlite3 payload-qmm.db "SELECT u.id, s.title, i.name FROM insight_story_units u JOIN stories s ON u.story_id = s.id JOIN insight_sets i ON u.insight_set_id = i.id;"
```

## 🔧 如果没有数据

如果缺少数据，可以通过接口创建：

```bash
# 创建 Theme
curl -X POST http://127.0.0.1:3000/api/themes \
  -H "Authorization: users API-Key YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Theme"}'

# 创建 Story（关联 Theme）
curl -X POST http://127.0.0.1:3000/api/stories \
  -H "Authorization: users API-Key YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Story", "theme": THEME_ID, "status": "published"}'

# 创建 InsightSet（关联 Theme）
curl -X POST http://127.0.0.1:3000/api/insight-sets \
  -H "Authorization: users API-Key YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test InsightSet", "theme": THEME_ID, "status": "active"}'
```

## 📊 效果对比

### 修改前（复杂）

```
1. 选择 Unit（从多个相似名称中选择）
2. 选择 Story Version（需要知道哪个版本匹配）
3. 选择 InsightSet Version（需要知道哪个版本匹配）
4. 容易选错，验证失败
```

### 修改后（简单）

```
1. 选择 Theme（清晰的名称）
2. 点击 Auto-Fill Form
3. 配置发布时间
4. 保存完成
```

## 🎉 完成

就是这样！现在创建 Unit Release 只需要几秒钟，而且不会出错。

详细文档请查看：UNIT_RELEASE_SOLUTION.md
