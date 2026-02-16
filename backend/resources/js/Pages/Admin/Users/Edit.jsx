import AdminLayout from '@/Layouts/AdminLayout';
import UserForm from '@/Pages/Admin/Users/UserForm';
import { useForm } from '@inertiajs/react';

export default function Edit({ user, options }) {
    const form = useForm({
        username: user.username || '',
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        country: user.country || '',
        membership_tier: user.membership_tier || 'free',
        kyc_status: user.kyc_status || 'pending',
        timezone: user.timezone || '',
        password: '',
        password_confirmation: '',
        notification_email_alerts: Boolean(user.notification_email_alerts),
        email_verified: Boolean(user.email_verified),
        is_admin: Boolean(user.is_admin),
    });

    const submit = (event) => {
        event.preventDefault();
        form.put(`/admin/users/${user.id}`);
    };

    return (
        <AdminLayout title="Edit User">
            <UserForm
                form={form}
                options={options}
                heading={`Edit ${user.name}`}
                description="Update profile data, access level, and account state."
                submitLabel="Save Changes"
                onSubmit={submit}
                showPasswordHelp
            />
        </AdminLayout>
    );
}
