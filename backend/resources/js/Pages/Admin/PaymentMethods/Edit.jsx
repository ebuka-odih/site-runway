import AdminLayout from '@/Layouts/AdminLayout';
import PaymentMethodForm from '@/Pages/Admin/PaymentMethods/PaymentMethodForm';
import { adminPath } from '@/lib/adminPath';
import { useForm, usePage } from '@inertiajs/react';

export default function Edit({ method, options }) {
    const { url } = usePage();
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
        form.put(adminPath(url, `payment-methods/${method.id}`));
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
                cancelHref={adminPath(url, 'payment-methods')}
            />
        </AdminLayout>
    );
}
