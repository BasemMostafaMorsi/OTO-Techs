/// <reference types="node" />
import { test, expect, Page } from '../../../helpers/test';
import { login } from '../../../helpers/auth';
import { mkdir, stat } from 'node:fs/promises';
const base = '/en/contacts/configuration/categories', api = '/sales/categories';
const row = (page: Page, id: string) => page.getByRole('row').filter({ has: page.getByText('#' + id, { exact: true }) });
const nameField = (page: Page) => page.getByRole('dialog').getByRole('textbox', { name: 'Category Name *', exact: true });
async function open(page: Page) {
    const p = page.waitForResponse(r => r.request().method() === 'GET' && r.url().includes(api + '?')); await page.goto(base); const response = await p; expect(response.ok()).toBeTruthy(); const data = (await response.json()).data;
    await expect(page.getByRole('button', { name: new RegExp(`^\\d+/${data.meta.total}$`) })).toBeVisible(); return data;
}
async function search(page: Page, value: string) {
    const p = page.waitForResponse(r => r.request().method() === 'GET' && r.url().includes(api + '?') && r.url().includes(encodeURIComponent(value))); await page.getByPlaceholder('Search', { exact: true }).fill(value); expect((await p).ok()).toBeTruthy();
}
async function select(page: Page, field: string, value: string) { await page.getByRole('combobox', { name: new RegExp('^' + field) }).click(); await page.getByRole('option', { name: value, exact: true }).click(); }
async function create(page: Page, name: string, type = 'Individual') {
    await open(page); await page.getByRole('button', { name: 'Create', exact: true }).click(); await nameField(page).fill(name); await select(page, 'Type', type); await page.getByRole('dialog').locator('[name=description]').fill('QA description ' + name);
    const p = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith(api)); await page.getByRole('dialog').getByRole('button', { name: 'Submit', exact: true }).click(); const response = await p, body = await response.json();
    await test.info().attach('create-category', { body: JSON.stringify({ status: response.status(), body }), contentType: 'application/json' }); expect(response.ok(), body.message).toBeTruthy(); expect(body.data?.id).toBeTruthy(); await expect(page.getByRole('dialog')).toBeHidden(); return String(body.data.id);
}
async function locate(page: Page, id: string, name: string) { await open(page); await search(page, name); await expect(row(page, id)).toContainText(name); return row(page, id); }
async function edit(page: Page, id: string, name: string) { await (await locate(page, id, name)).locator('button:has(i.tabler-edit)').click(); await expect(nameField(page)).toHaveValue(name); }
async function cleanup(page: Page, id: string, name: string) {
    const path = test.info().outputPath(`category-${id}-before-cleanup.png`); await page.screenshot({ path, fullPage: true }); await test.info().attach('before-cleanup', { path, contentType: 'image/png' });
    await (await locate(page, id, name)).locator('button:has(i.tabler-trash)').click(); const p = page.waitForResponse(r => r.request().method() === 'DELETE' && r.url().endsWith(api + '/' + id)); await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click(); expect((await p).ok()).toBeTruthy(); await expect(row(page, id)).toHaveCount(0);
}
async function complete(page: Page) {
    const counter = page.getByRole('button', { name: /^\d+\/\d+$/ }), counts = async () => (await counter.innerText()).split('/').map(Number); const total = (await counts())[1];
    for (let i = 0; (await counts())[0] < total && i < 100; i++) { const previous = (await counts())[0]; await page.getByRole('table').evaluate(table => { let p = table.parentElement; while (p && p.scrollHeight <= p.clientHeight) p = p.parentElement; const e = p || document.scrollingElement; if (e) e.scrollTop = e.scrollHeight; }); await expect.poll(async () => (await counts())[0]).toBeGreaterThan(previous); }
    await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(total); return total;
}
test.beforeEach(async ({ page }) => { test.setTimeout(150_000); await mkdir('artifacts/business-partners/contact-settings/customer-categories', { recursive: true }); await login(page); });
test.afterEach(async ({ page }, info) => { const path = `artifacts/business-partners/contact-settings/customer-categories/${info.title.replace(/[^a-z0-9]+/gi, '-')}.png`; await page.screenshot({ path, fullPage: true }); await info.attach('category-screen', { path, contentType: 'image/png' }); });

test('@customer-categories required name and type prevent submission', async ({ page }) => {
    await open(page); await page.getByRole('button', { name: 'Create', exact: true }).click(); const writes: string[] = []; page.on('request', r => { if (r.method() === 'POST' && r.url().endsWith(api)) writes.push(r.url()); }); await page.getByRole('dialog').getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.getByText('Name is required', { exact: true })).toBeVisible(); await expect(page.getByText('Type is required', { exact: true })).toBeVisible(); expect(writes).toEqual([]);
});
for (const type of ['Individual', 'Governmental', 'Commercial']) {
    test(`@customer-categories ${type} create edit persist and available on customer form`, async ({ page }, info) => {
        const name = `CAT-E2E-${type}-${Date.now()}`; let id: string | undefined;
        try {
            id = await create(page, name, type); await edit(page, id, name); await expect(page.getByRole('dialog').getByRole('combobox')).toHaveValue(type); await expect(page.getByRole('dialog').locator('[name=description]')).toHaveValue('QA description ' + name);
            await nameField(page).fill(name + '-EDITED'); await page.getByRole('dialog').locator('[name=description]').fill('Edited category description'); const p = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(api + '/' + id)); await page.getByRole('dialog').getByRole('button', { name: 'Submit', exact: true }).click(); const response = await p; expect(response.ok()).toBeTruthy(); await info.attach('update-category', { body: JSON.stringify({ submitted: response.request().postDataJSON(), body: await response.json() }), contentType: 'application/json' });
            await edit(page, id, name + '-EDITED'); await expect(page.getByRole('dialog').locator('[name=description]')).toHaveValue('Edited category description'); await expect(page.getByRole('dialog').getByRole('combobox')).toHaveValue(type);
            await page.goto('/en/contacts/customers/create'); await page.getByRole('radio', { name: type, exact: true }).check(); await page.getByRole('combobox', { name: 'Category', exact: true }).click(); const option = page.getByRole('option').filter({ hasText: name + '-EDITED' }); await expect(option).toBeVisible(); await option.click(); await expect(page.getByRole('combobox', { name: 'Category', exact: true })).toHaveValue(name + '-EDITED');
        } finally { if (id) await cleanup(page, id, name); }
    });
}
test('@customer-categories cancel create does not save', async ({ page }) => {
    const name = `CAT-E2E-UNSAVED-${Date.now()}`; await open(page); await page.getByRole('button', { name: 'Create', exact: true }).click(); await nameField(page).fill(name); await select(page, 'Type', 'Individual'); await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click(); await expect(page.getByRole('dialog')).toBeHidden(); await search(page, name); await expect(page.getByRole('button', { name: '0/0', exact: true })).toBeVisible();
});
test('@customer-categories cancel edit and delete preserve category', async ({ page }) => {
    const name = `CAT-E2E-CANCEL-${Date.now()}`; let id: string | undefined;
    try { id = await create(page, name); await edit(page, id, name); await nameField(page).fill(name + '-UNSAVED'); await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click(); await edit(page, id, name); await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click(); await row(page, id).locator('button:has(i.tabler-trash)').click(); await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click(); await locate(page, id, name); }
    finally { if (id) await cleanup(page, id, name); }
});
test('@customer-categories deactivate and reactivate persist', async ({ page }) => {
    const name = `CAT-E2E-STATUS-${Date.now()}`; let id: string | undefined;
    try { id = await create(page, name); for (const active of [false, true]) { const target = await locate(page, id, name), toggle = target.locator('input.MuiSwitch-input'); await toggle.click(); await expect(toggle).toBeChecked({ checked: active }); await page.reload(); await expect(row(page, id).locator('input.MuiSwitch-input')).toBeChecked({ checked: active }); } }
    finally { if (id) await cleanup(page, id, name); }
});
for (const type of ['Individual', 'Governmental', 'Commercial']) {
    test(`@customer-categories type filter and reset: ${type}`, async ({ page }) => {
        const name = `CAT-E2E-FILTER-${Date.now()}`; let id: string | undefined;
        try {
            id = await create(page, name, type); const data = await open(page); await complete(page); await page.getByRole('button', { name: 'Filter', exact: true }).click(); await select(page, 'Type', type); const p = page.waitForResponse(r => r.url().includes(api + '?')); await page.getByRole('button', { name: 'Submit', exact: true }).click(); await p; await expect(row(page, id)).toBeVisible(); await complete(page);
            const heads = (await page.getByRole('columnheader').allTextContents()).map(x => x.trim().toUpperCase()), index = heads.indexOf('TYPE'); expect(index).toBeGreaterThan(-1); for (const r of await page.getByRole('table').locator('tbody tr').all()) await expect(r.locator('td').nth(index)).toHaveText(type);
            await page.getByRole('button', { name: 'Filter', exact: true }).click(); await page.getByRole('button', { name: 'Reset', exact: true }).click(); await expect(page.getByRole('button', { name: new RegExp(`^\\d+/${data.meta.total}$`) })).toBeVisible();
        } finally { if (id) await cleanup(page, id, name); }
    });
}
for (const status of ['Active', 'Inactive']) {
    test(`@customer-categories status filter: ${status}`, async ({ page }) => {
        const name = `CAT-E2E-STATEFILTER-${Date.now()}`; let id: string | undefined;
        try {
            id = await create(page, name); await locate(page, id, name); if (status === 'Inactive') { await row(page, id).locator('input.MuiSwitch-input').click(); await expect(row(page, id).locator('input.MuiSwitch-input')).not.toBeChecked(); await page.reload(); await expect(row(page, id).locator('input.MuiSwitch-input')).not.toBeChecked(); }
            await open(page); await page.getByRole('button', { name: 'Filter', exact: true }).click(); await select(page, 'Status', status); const p = page.waitForResponse(r => r.url().includes(api + '?')); await page.getByRole('button', { name: 'Submit', exact: true }).click(); await p; await expect(row(page, id)).toBeVisible(); await complete(page);
            const toggles = page.getByRole('table').locator('tbody input.MuiSwitch-input'); expect(await toggles.count()).toBeGreaterThan(0); for (const toggle of await toggles.all()) await expect(toggle).toBeChecked({ checked: status === 'Active' });
        } finally { if (id) await cleanup(page, id, name); }
    });
}
test('@customer-categories complete list search reset and export', async ({ page }, info) => {
    const pages = new Map<number, string[]>(), pending: Promise<void>[] = []; page.on('response', r => { if (r.ok() && r.request().method() === 'GET' && r.url().includes(api + '?')) pending.push(r.json().then(b => { pages.set(b.data.meta.current_page, b.data.collection.map((x: { id: number }) => String(x.id))); })); });
    const data = await open(page); const total = await complete(page); await Promise.all(pending); const ids = await page.getByRole('table').locator('tbody tr').evaluateAll(es => es.map(e => e.textContent?.match(/#(\d+)/)?.[1])); expect(new Set(ids).size).toBe(total); expect(ids.slice().sort()).toEqual([...pages.values()].flat().sort()); await info.attach('all-category-ids', { body: JSON.stringify({ total, ids }), contentType: 'application/json' });
    await search(page, `NO-CATEGORY-${Date.now()}`); await expect(page.getByRole('button', { name: '0/0', exact: true })).toBeVisible(); await search(page, ''); await expect(page.getByRole('button', { name: new RegExp(`^\\d+/${data.meta.total}$`) })).toBeVisible();
    const p = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export', exact: true }).click(); const download = await p; expect(await download.failure()).toBeNull(); const path = info.outputPath(download.suggestedFilename()); await download.saveAs(path); expect((await stat(path)).size).toBeGreaterThan(0); await info.attach('category-export', { path, contentType: 'application/octet-stream' });
});

