import AdminLayout from '@/Layouts/AdminLayout';
import PaymentMethodForm from '@/Pages/Admin/PaymentMethods/PaymentMethodForm';
import { useForm } from '@inertiajs/react';

export default function Create({ options }) {
    const form = useForm({
        name: '',
        channel: options.channels[0] || 'bank_transfer',
        currency: 'USD',
        network: '',
        wallet_address: '',
        status: 'active',
        description: '',
        display_order: 0,
    });

    const submit = (event) => {
        event.preventDefault();
        form.post('/admin/payment-methods');
    };

    return (
        <AdminLayout title="Create Payment Method">
            <PaymentMethodForm
                form={form}
                options={options}
                heading="Create Payment Method"
                description="Add a new deposit or withdrawal channel using clear, explicit fields."
                submitLabel="Create Method"
                onSubmit={submit}
            />
        </AdminLayout>
    );
}
