import AdminLayout from '@/Layouts/AdminLayout';
import PaymentMethodForm from '@/Pages/Admin/PaymentMethods/PaymentMethodForm';
import { useForm } from '@inertiajs/react';

export default function Edit({ method, options }) {
    const form = useForm({
        name: method.name || '',
        channel: method.channel || (options.channels[0] || 'bank_transfer'),
        currency: method.currency || 'USD',
        network: method.network || '',
        wallet_address: method.wallet_address || '',
        status: method.status || 'active',
        description: method.description || '',
        display_order: Number(method.display_order || 0),
    });

    const submit = (event) => {
        event.preventDefault();
        form.put(`/admin/payment-methods/${method.id}`);
    };

    return (
        <AdminLayout title="Edit Payment Method">
            <PaymentMethodForm
                form={form}
                options={options}
                heading={`Edit ${method.name}`}
                description="Update payment method details and operational settings."
                submitLabel="Save Changes"
                onSubmit={submit}
            />
        </AdminLayout>
    );
}
