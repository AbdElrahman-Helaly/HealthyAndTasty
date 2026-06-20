const fs = require('fs');
const path = require('path');

const discountsPath = path.join(__dirname, 'src/pages/DiscountsPage.tsx');
const bannersPath = path.join(__dirname, 'src/pages/BannersPage.tsx');
const sidebarPath = path.join(__dirname, 'src/components/layout/Sidebar.tsx');
const authLayoutPath = path.join(__dirname, 'src/layouts/AuthLayout.tsx');

let dCode = fs.readFileSync(discountsPath, 'utf8');
let bCode = fs.readFileSync(bannersPath, 'utf8');
let sCode = fs.readFileSync(sidebarPath, 'utf8');
let aCode = fs.readFileSync(authLayoutPath, 'utf8');

// --- DISCOUNTS PAGE ---

// 1. Imports
dCode = dCode.replace(
  "import { useCallback, useEffect, useMemo, useState } from 'react';",
  "import { useCallback, useEffect, useMemo, useState, useRef } from 'react';"
);
dCode = dCode.replace(
  "import { Plus, Pencil, Trash2 } from 'lucide-react';",
  "import { Plus, Pencil, Trash2, Tag } from 'lucide-react';"
);
dCode = dCode.replace(
  "import { LoadingSkeleton } from '@/components/ui/Spinner';",
  "import { LoadingSkeleton } from '@/components/ui/Spinner';\nimport { EmptyState } from '@/components/ui/EmptyState';"
);

// 2. Drawer State & dirty
dCode = dCode.replace(
  "const [advancedOpen, setAdvancedOpen] = useState(false);",
  `const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const isDirtyRef = useRef(false);

  function markDirty() {
    isDirtyRef.current = true;
  }

  function handleCloseRequest() {
    if (isDirtyRef.current) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  }`
);

dCode = dCode.replace(
  "setAdvancedOpen(false);\n  }, [editTarget, open, types, targets]);",
  "setAdvancedOpen(false);\n    isDirtyRef.current = false;\n  }, [editTarget, open, types, targets]);"
);

// 3. Mark dirty on field changes
dCode = dCode.replace(/onChange=\{\(e\) => setName\(e\.target\.value\)\}/g, "onChange={(e) => { setName(e.target.value); markDirty(); }}");
dCode = dCode.replace(/onChange=\{\(e\) => setCouponCode\(e\.target\.value\.toUpperCase\(\)\)\}/g, "onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); markDirty(); }}");
dCode = dCode.replace(/onChange=\{\(e\) => setTypeValue\(Number\(e\.target\.value\)\)\}/g, "onChange={(e) => { setTypeValue(Number(e.target.value)); markDirty(); }}");
dCode = dCode.replace(/onChange=\{\(e\) => setValue\(Number\(e\.target\.value\)\)\}/g, "onChange={(e) => { setValue(Number(e.target.value)); markDirty(); }}");

dCode = dCode.replace(
  "onChange={(e) => setTargetValue(Number(e.target.value))}",
  `onChange={(e) => {
                const val = Number(e.target.value);
                setTargetValue(val);
                markDirty();
                const selected = targets.find(t => t.value === val);
                if (selected?.name !== 'SpecificProducts') setProductIds([]);
                if (selected?.name !== 'SpecificCategories') setCategoryIds([]);
              }}`
);

dCode = dCode.replace(/onChange=\{\(e\) => setStartDate\(e\.target\.value\)\}/g, "onChange={(e) => { setStartDate(e.target.value); markDirty(); }}");
dCode = dCode.replace(/onChange=\{\(e\) => setEndDate\(e\.target\.value\)\}/g, "onChange={(e) => { setEndDate(e.target.value); markDirty(); }}");
dCode = dCode.replace(/onChange=\{\(e\) => setUsageLimit\(Number\(e\.target\.value\)\)\}/g, "onChange={(e) => { setUsageLimit(Number(e.target.value)); markDirty(); }}");
dCode = dCode.replace(/onChange=\{\(e\) => setPerUserLimit\(Number\(e\.target\.value\)\)\}/g, "onChange={(e) => { setPerUserLimit(Number(e.target.value)); markDirty(); }}");
dCode = dCode.replace(/onChange=\{\(e\) => setMinOrderAmount\(Number\(e\.target\.value\)\)\}/g, "onChange={(e) => { setMinOrderAmount(Number(e.target.value)); markDirty(); }}");
dCode = dCode.replace(/onChange=\{\(e\) => setMaxDiscountAmount\(Number\(e\.target\.value\)\)\}/g, "onChange={(e) => { setMaxDiscountAmount(Number(e.target.value)); markDirty(); }}");
dCode = dCode.replace(/onChange=\{setIsActive\}/g, "onChange={(val) => { setIsActive(val); markDirty(); }}");
dCode = dCode.replace(/onChange=\{\(e\) => setRuleConfigurationJson\(e\.target\.value\)\}/g, "onChange={(e) => { setRuleConfigurationJson(e.target.value); markDirty(); }}");
dCode = dCode.replace(/onChange=\{setProductIds\}/g, "onChange={(val) => { setProductIds(val); markDirty(); }}");
dCode = dCode.replace(/onChange=\{setCategoryIds\}/g, "onChange={(val) => { setCategoryIds(val); markDirty(); }}");

// 4. Past Start Date Guard (Create Only)
dCode = dCode.replace(
  "if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {\n      errs.dateError = t('discounts.dateValidationError');\n    }",
  `if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      errs.dateError = t('discounts.dateValidationError');
    }
    if (!isEdit && startDate && new Date(startDate) < new Date()) {
      errs.startDate = 'تاريخ البدء لا يمكن أن يكون في الماضي';
    }`
);

// 5. Specific Error Messages in handleSave
dCode = dCode.replace(
  "} catch {\n      showToast(t('discounts.errorGeneric'), 'error');\n    }",
  `} catch (err: any) {
      const msg = err?.payload?.message || err?.payload?.error || err?.message || '';
      if (msg.toLowerCase().includes('duplicate coupon') || msg.toLowerCase().includes('already exists')) {
        showToast('كود الخصم مستخدم بالفعل', 'error');
      } else if (msg) {
        showToast(msg, 'error');
      } else {
        showToast(t('discounts.errorGeneric'), 'error');
      }
    }`
);

// 6. Native Form + Enter to Submit & Unsaved Changes Warning in DiscountsPage Drawer
dCode = dCode.replace(
  "<FormDrawer\n      open={open}\n      onClose={onClose}",
  `<FormDrawer
      open={open}
      onClose={handleCloseRequest}`
);

dCode = dCode.replace(
  "<Button variant=\"secondary\" onClick={onClose}>",
  `<Button variant="secondary" type="button" onClick={handleCloseRequest}>`
);

dCode = dCode.replace(
  "<Button loading={saving} onClick={handleSave}>",
  `<Button type="submit" form="discount-form" loading={saving}>`
);

dCode = dCode.replace(
  "<div className=\"flex flex-col gap-6\">\n        \n        {/* Basic Info */}",
  `<form id="discount-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex flex-col gap-6">
        
        {/* Confirm Close Dialog */}
        <ConfirmDialog
          open={showConfirmClose}
          onClose={() => setShowConfirmClose(false)}
          onConfirm={() => {
            setShowConfirmClose(false);
            onClose();
          }}
          title="تنبيه"
          message="لديك تغييرات غير محفوظة، هل تريد إغلاق النموذج؟"
          confirmText="إغلاق"
          cancelText="متابعة التعديل"
          variant="danger"
        />

        {/* Basic Info */}`
);

dCode = dCode.replace(
  "</FormDrawer>",
  `  </form>\n    </FormDrawer>`
);

// 7. Number Input Constraints
dCode = dCode.replace(
  "type=\"number\"\n              value={String(value)}",
  `type="number"
              min={0}
              max={selectedTypeObj?.name === 'Percentage' ? 100 : undefined}
              value={String(value)}`
);

dCode = dCode.replace(/type="number"\n(.*?)value=\{String\((usageLimit|perUserLimit|minOrderAmount|maxDiscountAmount)\)\}/g, "type=\"number\"\n              min={0}\n$1value={String($2)}");

// 8. Delete Confirmation Content
dCode = dCode.replace(
  "message={t('discounts.deleteConfirm')}",
  "message={`هل أنت متأكد من حذف الخصم \"\${deleteTarget?.name}\"؟ لا يمكن التراجع عن هذا الإجراء.`}"
);

// 9. Icon Button Accessibility
dCode = dCode.replace(
  "<Button variant=\"ghost\" size=\"icon\" onClick={() => { setEditTarget(d); setFormOpen(true); }} className=\"h-8 w-8 text-primary hover:bg-primary/10\">\n            <Pencil className=\"h-4 w-4\" />\n          </Button>",
  `<Button variant="ghost" size="icon" onClick={() => { setEditTarget(d); setFormOpen(true); }} className="h-8 w-8 text-primary hover:bg-primary/10" title="تعديل الخصم" aria-label={\`تعديل الخصم \${d.name}\`}>
            <Pencil className="h-4 w-4" />
          </Button>`
);

dCode = dCode.replace(
  "<Button variant=\"ghost\" size=\"icon\" onClick={() => setDeleteTarget(d)} className=\"h-8 w-8 text-error hover:bg-error/10\">\n            <Trash2 className=\"h-4 w-4\" />\n          </Button>",
  `<Button variant="ghost" size="icon" onClick={() => setDeleteTarget(d)} className="h-8 w-8 text-error hover:bg-error/10" title="حذف الخصم" aria-label={\`حذف الخصم \${d.name}\`}>
            <Trash2 className="h-4 w-4" />
          </Button>`
);

// 10. Empty State CTA
dCode = dCode.replace(
  "emptyMessage={t('discounts.noDiscounts')}",
  `emptyMessage={t('discounts.noDiscounts')}
            emptyState={
              <EmptyState
                icon={<Tag className="h-6 w-6" />}
                title={t('discounts.noDiscounts')}
                action={
                  <Button onClick={() => { setEditTarget(null); setFormOpen(true); }} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    {t('discounts.addButton')}
                  </Button>
                }
              />
            }`
);
// Wait, DataTable might not have an emptyState prop in this project, it might just take emptyMessage. Let's look at BannersPage to see how it renders EmptyState. BannersPage renders it OUTSIDE the DataTable. DiscountsPage uses DataTable. Let's fix that.
// If DiscountsPage uses DataTable and DataTable doesn't support emptyState prop, we must render it instead of DataTable when length is 0.
dCode = dCode.replace(
  "<DataTable\n            columns={columns}\n            data={displayDiscounts}\n            keyExtractor={(d) => d.id}\n            emptyMessage={t('discounts.noDiscounts')}\n          />",
  `{displayDiscounts.length === 0 ? (
            <EmptyState
              icon={<Tag className="h-6 w-6" />}
              title={t('discounts.noDiscounts')}
              action={
                <Button onClick={() => { setEditTarget(null); setFormOpen(true); }} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  {t('discounts.addButton')}
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={columns}
              data={displayDiscounts}
              keyExtractor={(d) => d.id}
              emptyMessage={t('discounts.noDiscounts')}
            />
          )}`
);

// --- BANNERS PAGE ---

// 1. Broken Image Fallback
bCode = bCode.replace(
  "import { Plus, Pencil, Trash2, ImageIcon, UploadCloud } from 'lucide-react';",
  "import { Plus, Pencil, Trash2, ImageIcon, UploadCloud, ImageOff } from 'lucide-react';"
);

bCode = bCode.replace(
  "const [file, setFile] = useState<File | null>(null);",
  `const [file, setFile] = useState<File | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const isDirtyRef = useRef(false);
  
  function markDirty() {
    isDirtyRef.current = true;
  }
  
  function handleCloseRequest() {
    if (isDirtyRef.current) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  }`
);

bCode = bCode.replace(
  "setFieldErrors({});\n  }, [editTarget, open]);",
  "setFieldErrors({});\n    isDirtyRef.current = false;\n  }, [editTarget, open]);"
);

bCode = bCode.replace(
  "setFile(chosen);",
  "setFile(chosen); markDirty();"
);

bCode = bCode.replace(
  "setCategoryId(e.target.value);\n              setFieldErrors((err) => ({ ...err, categoryId: '' }));",
  "setCategoryId(e.target.value);\n              setFieldErrors((err) => ({ ...err, categoryId: '' }));\n              markDirty();"
);

bCode = bCode.replace(
  "onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}",
  "onChange={(e) => { setSortOrder(parseInt(e.target.value, 10) || 0); markDirty(); }}"
);

bCode = bCode.replace(
  "onChange={setIsActive}",
  "onChange={(val) => { setIsActive(val); markDirty(); }}"
);

// Banners specific error messages
bCode = bCode.replace(
  "} catch {\n      showToast(t('banners.errorGeneric'), 'error');\n    }",
  `} catch (err: any) {
      const msg = err?.payload?.message || err?.payload?.error || err?.message || '';
      if (msg.toLowerCase().includes('large') || msg.toLowerCase().includes('size')) {
        showToast('حجم الصورة كبير جداً', 'error');
      } else if (msg.toLowerCase().includes('format') || msg.toLowerCase().includes('unsupported')) {
        showToast('صيغة الملف غير مدعومة', 'error');
      } else if (msg) {
        showToast(msg, 'error');
      } else {
        showToast(t('banners.errorGeneric'), 'error');
      }
    }`
);

// Native Form + Unsaved Warning for Banners Drawer
bCode = bCode.replace(
  "<FormDrawer\n      open={open}\n      onClose={onClose}",
  `<FormDrawer
      open={open}
      onClose={handleCloseRequest}`
);

bCode = bCode.replace(
  "<Button variant=\"secondary\" onClick={onClose}>",
  `<Button variant="secondary" type="button" onClick={handleCloseRequest}>`
);

bCode = bCode.replace(
  "<Button loading={saving} onClick={handleSave}>",
  `<Button type="submit" form="banner-form" loading={saving}>`
);

bCode = bCode.replace(
  "<div className=\"flex flex-col gap-5\">\n        {/* Image upload */}",
  `<form id="banner-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="flex flex-col gap-5">
        <ConfirmDialog
          open={showConfirmClose}
          onClose={() => setShowConfirmClose(false)}
          onConfirm={() => {
            setShowConfirmClose(false);
            onClose();
          }}
          title="تنبيه"
          message="لديك تغييرات غير محفوظة، هل تريد إغلاق النموذج؟"
          confirmText="إغلاق"
          cancelText="متابعة التعديل"
          variant="danger"
        />
        {/* Image upload */}`
);

bCode = bCode.replace(
  "        </div>\n    </FormDrawer>",
  "        </form>\n    </FormDrawer>"
);

// Banners Toggle ARIA & Delete Confirm & Fallback
bCode = bCode.replace(
  "export function BannersPage() {",
  `export function BannersPage() {`
);

// Wait, the banner card toggle switch
bCode = bCode.replace(
  "checked={banner.isActive}\n            onChange={() => onToggle(banner)}\n            disabled={toggling}",
  `checked={banner.isActive}
            onChange={() => onToggle(banner)}
            disabled={toggling}
            aria-label={\`تفعيل/إيقاف البانر - \${categoryName}\`}`
);

// Add aria-label prop to ToggleSwitch definition
bCode = bCode.replace(
  "interface ToggleSwitchProps {\n  checked: boolean;\n  onChange: (checked: boolean) => void;\n  disabled?: boolean;\n}",
  `interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}`
);

bCode = bCode.replace(
  "function ToggleSwitch({ checked, onChange, disabled }: ToggleSwitchProps) {",
  `function ToggleSwitch({ checked, onChange, disabled, 'aria-label': ariaLabel }: ToggleSwitchProps) {`
);

bCode = bCode.replace(
  "role=\"switch\"\n      aria-checked={checked}\n      disabled={disabled}\n      onClick={() => onChange(!checked)}",
  `role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}`
);

// Delete confirm text with thumbnail
bCode = bCode.replace(
  "message={t('banners.deleteConfirm')}",
  `message={
          <div className="flex flex-col items-center gap-3">
            <p>هل أنت متأكد من حذف هذا البانر؟ لا يمكن التراجع عن هذا الإجراء.</p>
            {deleteTarget && (
              <div className="mt-2 flex flex-col items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container/20 p-3 w-full">
                {deleteTarget.imageUrl ? (
                  <img src={getFullImageUrl(deleteTarget.imageUrl)} alt="banner" className="h-20 rounded object-contain" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-on-surface-variant/40" />
                )}
                <span className="text-sm font-medium text-on-surface">{categoryMap[deleteTarget.categoryId] ?? '—'}</span>
              </div>
            )}
          </div>
        }`
);

// Image broken fallback
bCode = bCode.replace(
  "src={getFullImageUrl(banner.imageUrl)}\n            alt=\"banner\"\n            className=\"h-full w-full object-cover transition-transform duration-300 group-hover:scale-105\"\n            loading=\"lazy\"",
  `src={getFullImageUrl(banner.imageUrl)}
            alt="banner"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; // prevent infinite loop
              target.style.display = 'none';
              target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
              const fallback = document.createElement('div');
              fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-on-surface-variant/40"><path d="m21 21-4.3-4.3"/><path d="M14.7 14.7a10 10 0 1 0-10-10"/><path d="M10.3 10.3a4 4 0 1 0-4-4"/><path d="m10.3 10.3-4.3-4.3"/><path d="M21 21l-9-9"/></svg>';
              target.parentElement?.appendChild(fallback.firstChild as Node);
            }}`
);
// Note: imageOnError uses a simple DOM injection or hides the image. A better way in React is state, but since this is mapped, a simple native onError is fine. Wait, better to create a state for image error inside BannerCard. Let's do that.
bCode = bCode.replace(
  "function BannerCard({ banner, categoryName, onEdit, onDelete, onToggle, toggling }: BannerCardProps) {\n  const { t } = useTranslation();",
  `function BannerCard({ banner, categoryName, onEdit, onDelete, onToggle, toggling }: BannerCardProps) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);`
);

bCode = bCode.replace(
  "{banner.imageUrl ? (\n          <img\n            src={getFullImageUrl(banner.imageUrl)}\n            alt=\"banner\"\n            className=\"h-full w-full object-cover transition-transform duration-300 group-hover:scale-105\"\n            loading=\"lazy\"\n          />\n        ) : (\n          <div className=\"flex h-full items-center justify-center text-on-surface-variant/40\">\n            <ImageIcon className=\"h-10 w-10\" />\n          </div>\n        )}",
  `{banner.imageUrl && !imgError ? (
          <img
            src={getFullImageUrl(banner.imageUrl)}
            alt="banner"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-on-surface-variant/40">
            <ImageOff className="h-10 w-10" />
          </div>
        )}`
);

// Ensure ToggleSwitch aria-label in DiscountsPage as well if needed? The user only specified BannersPage for ToggleSwitch.

// --- LOGO REPLACEMENT ---
// In AuthLayout.tsx
aCode = aCode.replace(
  "<div className=\"mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-lg font-bold text-white shadow-lg\">\n            {branding.shortName}\n          </div>",
  `<img src="/logo.png" alt="Healthy & Tasty" className="mx-auto mb-4 h-14 w-14 object-contain" />`
);

// In Sidebar.tsx
sCode = sCode.replace(
  "<div className=\"flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm font-bold text-white\">\n          {branding.shortName}\n        </div>",
  `<img src="/logo.png" alt="Healthy & Tasty" className="h-9 w-9 shrink-0 object-contain" />`
);

fs.writeFileSync(discountsPath, dCode);
fs.writeFileSync(bannersPath, bCode);
fs.writeFileSync(sidebarPath, sCode);
fs.writeFileSync(authLayoutPath, aCode);
console.log('Patched all files.');
