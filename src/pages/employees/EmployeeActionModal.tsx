import { useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { changeEmployeePassword, deleteEmployee } from '@/api/employees.api';
import { ApiError } from '@/lib/apiClient';
import type { Employee } from '@/types';

export function EmployeeActionModal({ employee, action, onClose, onSuccess }: {
  employee: Employee;
  action: 'password' | 'delete';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const pending = useRef(false);
  const close = () => {
    if (pending.current) return;
    setPassword('');
    setConfirmation('');
    onClose();
  };
  const submit = async () => {
    if (pending.current) return;
    if (action === 'password') {
      const issues = [];
      if (password.length < 8 || password.length > 128) issues.push('الباسورد يجب أن يكون من 8 إلى 128 حرفًا.');
      if (password !== confirmation) issues.push('تأكيد الباسورد غير مطابق.');
      if (issues.length) { setErrors(issues); return; }
    }
    pending.current = true;
    setSaving(true);
    setErrors([]);
    try {
      if (action === 'password') await changeEmployeePassword(employee.id, password);
      else await deleteEmployee(employee.id);
      setPassword('');
      setConfirmation('');
    } catch (error) {
      setErrors(error instanceof ApiError ? [error.message, ...error.errors] : [error instanceof Error ? error.message : 'فشل تنفيذ الطلب.']);
      return;
    } finally {
      pending.current = false;
      setSaving(false);
    }
    onSuccess();
  };
  return <Modal open onClose={close} title={action === 'password' ? `تغيير الباسورد: ${employee.name}` : 'حذف الموظف'}>
    <form dir="rtl" className="flex flex-col gap-4" onSubmit={event => { event.preventDefault(); void submit(); }}>
      {action === 'password' ? <>
        <Input label="الباسورد الجديد" type={visible ? 'text' : 'password'} autoComplete="new-password" value={password} disabled={saving} onChange={event => setPassword(event.target.value)} />
        <Input label="تأكيد الباسورد" type={visible ? 'text' : 'password'} autoComplete="new-password" value={confirmation} disabled={saving} onChange={event => setConfirmation(event.target.value)} />
        <Button type="button" variant="ghost" disabled={saving} aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{visible ? 'إخفاء الباسورد' : 'إظهار الباسورد'}</Button>
      </> : <p className="text-sm text-on-surface-variant">هل تريد حذف الموظف «{employee.name}»؟ الحذف نهائي ولا يمكن التراجع عنه.</p>}
      {errors.length > 0 && <div role="alert" className="text-sm text-error">{errors.map((error, index) => <p key={index}>{error}</p>)}</div>}
      <div className="flex justify-end gap-3"><Button type="button" variant="secondary" disabled={saving} onClick={close}>إلغاء</Button><Button type="submit" variant={action === 'delete' ? 'danger' : 'primary'} loading={saving}>{action === 'delete' ? 'حذف نهائي' : 'حفظ الباسورد'}</Button></div>
    </form>
  </Modal>;
}
