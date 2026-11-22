import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface IndexEntry {
  id: string;
  title: string;
  name: string;
  type: 'story' | 'docs';
  tags?: string[];
}

const index = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', '..', '..', 'storybook', 'storybook-static', 'index.json'),
    'utf8',
  ),
) as { entries: Record<string, IndexEntry> };

const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && !entry.tags?.includes('no-visual'),
);

for (const story of stories) {
  test(`${story.title} / ${story.name}`, async ({ page }, testInfo) => {
    const theme = String(testInfo.project.metadata['theme'] ?? 'light');
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`);
    await page.locator('#storybook-root').waitFor();
    await page.waitForFunction(() => {
      const preview = (
        window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } }
      ).__STORYBOOK_PREVIEW__;
      return ['finished', 'errored', 'aborted'].includes(preview?.currentRender?.phase ?? '');
    });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect(page).toHaveScreenshot(`${story.id}.png`, { fullPage: true });
  });
}
