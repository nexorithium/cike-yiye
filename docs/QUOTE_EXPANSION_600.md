# 600 段原文库

保留既有60段及编号，新增540段。`content/expanded-quotes.json` 包含导读、原作上下文、来源记录ID和段落序号；`content/sources/import-manifest.json` 固定上游版本；公开许可位于 `/NOTICE-chinese-poetry.txt`。

新增内容由开放古典诗词语料的完整段落选取，经过简体转换和展示换行，未拼接或续写古诗。每首最多选择两段，过滤现有引句、重复版本、近似引句及已识别错署和乱码。上游选集存在异文和整理错误，因此来源核对不代表独立完成古籍校勘；界面明确说明所用版本。整首作品导读为项目原创，不作为每个选段的逐句译文，也不附会为作者心理诊断。

验证命令：

- `node tests/catalog-contract.mjs`
- `node tests/expanded-reading-contract.mjs`
- `node tests/model-contract.mjs`
- 本地Worker启动后 `node tests/reading-api.mjs`
- `node node_modules/typescript/bin/tsc --noEmit`

本次逐段比对540个选段与固定源记录，经OpenCC t2s转换后完全一致。旧60段内容与编号保留。候选检索有范围限制：模型每次读取96段（原60段加新增36段），最终返回1–3段；扩充库不代表每次把600段全文发给模型。
