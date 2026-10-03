import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import { resolve } from 'node:path';

describe('module import boundary', () => {
  it('rejects relative sibling internals and accepts an index import', async () => {
    const eslint = new ESLint();
    const filePath = resolve('tools/lint-fixtures/modules/billing/billing.ts');
    const bad = await eslint.lintText("import '../orders/orders.service.js';", { filePath });
    const good = await eslint.lintText("import '../orders/index.js';", { filePath });
    expect(bad[0].messages).toEqual([expect.objectContaining({ ruleId: 'boundaries/dependencies' })]);
    expect(good[0].messages).toEqual([]);
  });
});
