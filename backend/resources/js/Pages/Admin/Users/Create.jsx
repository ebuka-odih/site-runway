import AdminLayout from '@/Layouts/AdminLayout';
import UserForm from '@/Pages/Admin/Users/UserForm';
import { useForm } from '@inertiajs/react';

export default function Create({ options }) {
    const form = useForm({
        username: '',
        name: '',
        email: '',
        phone: '',
        country: 'United States',
        membership_tier: 'free',
        kyc_status: 'pending',
        timezone: 'UTC',
        password: '',
        password_confirmation: '',
        notification_email_alerts: true,
        email_verified: false,
        is_admin: false,
    });

    const submit = (event) => {
        event.preventDefault();
        form.post('/admin/users');
    };

    return (
        <AdminLayout title="Create User">
            <UserForm
                form={form}
                options={options}
                heading="Create New User"
                description="Add a new account and optionally grant admin privileges."
                submitLabel="Create User"
                onSubmit={submit}
            />
        </AdminLayout>
    );
}
