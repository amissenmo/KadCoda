import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import Spinner from '../../../../components/ui/Spinner';
import { listUsers, updateUser } from '../../../../services/adminApi';
import { adminUserEditSchema } from '../../../../validation/admin.schema';
import UserBasicInfoForm from './UserBasicInfoForm';
import UserEditActions from './UserEditActions';
import UserEditHeader from './UserEditHeader';
import UserSecurityForm from './UserSecurityForm';
import UserSettingsForm from './UserSettingsForm';

const roleOptions = [
  { value: 'student', label: 'دانشجو' },
  { value: 'teacher', label: 'مدرس' },
  { value: 'admin', label: 'مدیر' },
];

const statusOptions = [
  { value: 'active', label: 'فعال' },
  { value: 'inactive', label: 'غیرفعال' },
  { value: 'banned', label: 'مسدود' },
];

function PanelAdminUserEdit() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => listUsers(),
  });

  const rawUsers = Array.isArray(usersData)
    ? usersData
    : Array.isArray(usersData?.data)
      ? usersData.data
      : Array.isArray(usersData?.users)
        ? usersData.users
        : [];

  const targetUser =
    rawUsers.find((u) => String(u.id) === String(userId)) || rawUsers[0] || {};

  const fullName =
    `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim() ||
    targetUser.name ||
    'کاربر کدکدا';

  const headerUser = {
    id: targetUser.id || userId || '—',
    name: fullName,
    email: targetUser.email || '',
    mobile: targetUser.mobile || '09123456789',
    role: targetUser.role || 'student',
    status: targetUser.status || 'active',
    bio: targetUser.bio || '',
    avatar: fullName.charAt(0) || 'ک',
    joined_at: targetUser.created_at
      ? new Date(targetUser.created_at).toLocaleDateString('fa-IR')
      : '۱۴۰۳/۰۲/۰۵',
    last_login: targetUser.updated_at
      ? new Date(targetUser.updated_at).toLocaleDateString('fa-IR')
      : '۱۴۰۳/۰۵/۱۲',
    courses_count: targetUser.courses_count ?? 0,
    certificates_count: targetUser.certificates_count ?? 0,
    is_verified: targetUser.is_verified ?? true,
    has_support_access: targetUser.has_support_access ?? true,
  };

  const { control, setValue, handleSubmit } = useForm({
    resolver: zodResolver(adminUserEditSchema),
    values: {
      name: headerUser.name,
      email: headerUser.email,
      mobile: headerUser.mobile,
      role: headerUser.role,
      status: headerUser.status,
      bio: headerUser.bio,
      is_verified: headerUser.is_verified,
      has_support_access: headerUser.has_support_access,
      password: '',
      confirmPassword: '',
    },
  });

  const watchedValues = useWatch({ control });
  const [avatarName, setAvatarName] = useState('');

  const formAdapter = {
    name: watchedValues.name || '',
    email: watchedValues.email || '',
    mobile: watchedValues.mobile || '',
    role: watchedValues.role || 'student',
    status: watchedValues.status || 'active',
    bio: watchedValues.bio || '',
    avatar: null,
    is_verified: Boolean(watchedValues.is_verified),
    has_support_access: Boolean(watchedValues.has_support_access),
  };

  const setFormAdapter = (updater) => {
    const next = typeof updater === 'function' ? updater(formAdapter) : updater;
    Object.entries(next).forEach(([key, val]) => {
      if (key !== 'avatar') {
        setValue(key, val, { shouldDirty: true, shouldValidate: true });
      }
    });
  };

  const password = watchedValues.password || '';
  const confirmPassword = watchedValues.confirmPassword || '';

  const setPassword = (val) =>
    setValue('password', val, { shouldDirty: true, shouldValidate: true });
  const setConfirmPassword = (val) =>
    setValue('confirmPassword', val, {
      shouldDirty: true,
      shouldValidate: true,
    });

  const canSubmit =
    formAdapter.name.trim() !== '' && formAdapter.mobile.trim() !== '';

  const passwordsMismatch =
    password !== '' && confirmPassword !== '' && password !== confirmPassword;

  const updateMutation = useMutation({
    mutationFn: (data) => {
      const nameParts = data.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email: data.email || undefined,
        mobile: data.mobile,
        role: data.role,
      };
      if (data.password) {
        payload.password = data.password;
      }
      return updateUser(headerUser.id, payload);
    },
    onSuccess: () => {
      toast.success('اطلاعات کاربر با موفقیت بروزرسانی شد.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      navigate('/panel-admin/users');
    },
    onError: (err) => {
      toast.error(err?.message || 'خطا در بروزرسانی اطلاعات کاربر.');
    },
  });

  const onSubmit = (data) => {
    if (!canSubmit || passwordsMismatch) return;
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <UserEditHeader user={headerUser} />

      <UserBasicInfoForm
        form={formAdapter}
        setForm={setFormAdapter}
        roleOptions={roleOptions}
      />

      <UserSecurityForm
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        passwordsMismatch={passwordsMismatch}
      />

      <UserSettingsForm
        form={formAdapter}
        setForm={setFormAdapter}
        avatarName={avatarName}
        setAvatarName={setAvatarName}
        statusOptions={statusOptions}
      />

      <UserEditActions
        canSubmit={canSubmit && !updateMutation.isPending}
        passwordsMismatch={passwordsMismatch}
      />
    </form>
  );
}

export default PanelAdminUserEdit;
