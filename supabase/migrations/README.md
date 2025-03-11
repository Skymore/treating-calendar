# Supabase 迁移文件

这个目录包含了Supabase数据库的迁移文件。

## 如何应用迁移

1. 确保你已经安装了Supabase CLI：

```bash
npm install --save-dev supabase
```

2. 登录到你的Supabase账户：

```bash
npx supabase login
```

3. 链接你的项目：

```bash
npx supabase link --project-ref <your-project-ref>
```

你可以在Supabase仪表板的项目设置中找到你的项目引用ID。

4. 应用迁移：

```bash
npx supabase db push
```

## 手动应用迁移

如果你不想使用Supabase CLI，你也可以手动应用这些迁移：

1. 登录到Supabase仪表板
2. 进入SQL编辑器
3. 复制迁移文件中的SQL代码
4. 在SQL编辑器中执行代码

## 迁移文件说明

- `20240311_auth_setup.sql`: 设置用户认证相关的表和权限 